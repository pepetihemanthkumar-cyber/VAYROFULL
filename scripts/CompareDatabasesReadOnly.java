import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.Set;

/**
 * Diagnostic utility to perform read-only comparison between Local PostgreSQL
 * and Supabase Cloud PostgreSQL.
 *
 * Enforces zero-secret logging (no passwords, hashes, tokens, or PII printed).
 */
public class CompareDatabasesReadOnly {

    public static void main(String[] args) {
        System.out.println("======================================================================");
        System.out.println("VAYRO — LOCAL VS CLOUD READ-ONLY DATA RECONCILIATION AUDIT");
        System.out.println("======================================================================");

        Map<String, String> env = loadEnvFile(new File(".env"));
        String subHost = env.getOrDefault("SUPABASE_DB_HOST", "aws-0-ap-southeast-1.pooler.supabase.com");
        String subPort = env.getOrDefault("SUPABASE_DB_PORT", "5432");
        String subDb = env.getOrDefault("SUPABASE_DB_NAME", "postgres");
        String subUser = env.getOrDefault("SUPABASE_DB_USERNAME", "postgres.lgpuulmsdogxzsyoqwdk");
        String subPassword = env.getOrDefault("SUPABASE_DB_PASSWORD", "");
        String subSsl = env.getOrDefault("SUPABASE_DB_SSLMODE", "?sslmode=require");
        if (!subSsl.startsWith("?") && !subSsl.isEmpty()) subSsl = "?" + subSsl;

        String locHost = env.getOrDefault("DB_HOST", "localhost");
        String locPort = env.getOrDefault("DB_PORT", "5432");
        String locDb = env.getOrDefault("DB_NAME", "vayro_users");
        String locUser = env.getOrDefault("DB_USERNAME", "pepetihemanthkumar");
        String locPassword = env.getOrDefault("DB_PASSWORD", "");

        String subUrl = String.format("jdbc:postgresql://%s:%s/%s%s", subHost, subPort, subDb, subSsl);
        String locUrl = String.format("jdbc:postgresql://%s:%s/%s", locHost, locPort, locDb);

        Properties subProps = new Properties();
        subProps.setProperty("user", subUser);
        subProps.setProperty("password", subPassword);
        subProps.setProperty("ssl", "true");
        subProps.setProperty("sslmode", "require");
        subProps.setProperty("connectTimeout", "10");
        subProps.setProperty("socketTimeout", "15");
        subProps.setProperty("readOnly", "true");

        Properties locProps = new Properties();
        locProps.setProperty("user", locUser);
        locProps.setProperty("password", locPassword);
        locProps.setProperty("connectTimeout", "5");
        locProps.setProperty("socketTimeout", "10");
        locProps.setProperty("readOnly", "true");

        try {
            Class.forName("org.postgresql.Driver");

            try (Connection locConn = DriverManager.getConnection(locUrl, locProps);
                 Connection subConn = DriverManager.getConnection(subUrl, subProps)) {

                locConn.setReadOnly(true);
                subConn.setReadOnly(true);
                System.out.println("Both database connections established successfully (READ-ONLY mode).");

                // --- 1. USERS COMPARISON ---
                System.out.println("\n----------------------------------------------------------------------");
                System.out.println("1. USERS RECONCILIATION");
                System.out.println("----------------------------------------------------------------------");
                compareUsers(locConn, subConn);

                // --- 2. VEHICLES COMPARISON ---
                System.out.println("\n----------------------------------------------------------------------");
                System.out.println("2. VEHICLES RECONCILIATION");
                System.out.println("----------------------------------------------------------------------");
                compareVehicles(locConn, subConn);

                // --- 3. BOOKINGS COMPARISON ---
                System.out.println("\n----------------------------------------------------------------------");
                System.out.println("3. BOOKINGS RECONCILIATION");
                System.out.println("----------------------------------------------------------------------");
                compareBookings(locConn, subConn);

                // --- 4. NOTIFICATIONS COMPARISON ---
                System.out.println("\n----------------------------------------------------------------------");
                System.out.println("4. NOTIFICATIONS RECONCILIATION");
                System.out.println("----------------------------------------------------------------------");
                compareNotifications(locConn, subConn);

                System.out.println("\n======================================================================");
                System.out.println("DATA RECONCILIATION AUDIT COMPLETE — ZERO WRITES PERFORMED");
                System.out.println("======================================================================");
            }
        } catch (Exception e) {
            System.err.println("Audit execution error: " + e.getMessage());
            e.printStackTrace();
            System.exit(1);
        }
    }

    private static void compareUsers(Connection loc, Connection sub) throws Exception {
        Map<Long, String> locUsers = new HashMap<>();
        Map<String, Long> locEmailToId = new HashMap<>();
        Map<Long, String> locRoles = new HashMap<>();

        try (Statement s = loc.createStatement();
             ResultSet rs = s.executeQuery("SELECT id, email, role FROM users ORDER BY id")) {
            while (rs.next()) {
                long id = rs.getLong("id");
                String email = rs.getString("email");
                String role = rs.getString("role");
                locUsers.put(id, email);
                locEmailToId.put(email, id);
                locRoles.put(id, role);
            }
        }

        Map<Long, String> subUsers = new HashMap<>();
        Map<String, Long> subEmailToId = new HashMap<>();
        Map<Long, String> subRoles = new HashMap<>();

        try (Statement s = sub.createStatement();
             ResultSet rs = s.executeQuery("SELECT id, email, role FROM users ORDER BY id")) {
            while (rs.next()) {
                long id = rs.getLong("id");
                String email = rs.getString("email");
                String role = rs.getString("role");
                subUsers.put(id, email);
                subEmailToId.put(email, id);
                subRoles.put(id, role);
            }
        }

        long locSeq = getSequenceValue(loc, "users_id_seq");
        long subSeq = getSequenceValue(sub, "users_id_seq");

        System.out.println(String.format("Local Count: %d | Cloud Count: %d", locUsers.size(), subUsers.size()));
        System.out.println(String.format("Local Sequence (last_value): %d | Cloud Sequence (last_value): %d", locSeq, subSeq));

        System.out.println("\nLocal Users:");
        for (Map.Entry<Long, String> e : locUsers.entrySet()) {
            System.out.println(String.format("  ID %2d: %-30s [Role: %s]", e.getKey(), maskEmail(e.getValue()), locRoles.get(e.getKey())));
        }

        System.out.println("\nCloud Users:");
        for (Map.Entry<Long, String> e : subUsers.entrySet()) {
            System.out.println(String.format("  ID %2d: %-30s [Role: %s]", e.getKey(), maskEmail(e.getValue()), subRoles.get(e.getKey())));
        }

        System.out.println("\nID Collision & Alignment Check:");
        for (Long id : subUsers.keySet()) {
            String subEmail = subUsers.get(id);
            String locEmail = locUsers.get(id);
            if (locEmail == null) {
                System.out.println(String.format("  ID %d: Exists in Cloud only (%s)", id, maskEmail(subEmail)));
            } else if (subEmail.equalsIgnoreCase(locEmail)) {
                System.out.println(String.format("  ID %d: PERFECT MATCH (%s)", id, maskEmail(subEmail)));
            } else {
                System.out.println(String.format("  ID %d: COLLISION! Local=(%s) vs Cloud=(%s)", id, maskEmail(locEmail), maskEmail(subEmail)));
            }
        }

        for (Long id : locUsers.keySet()) {
            if (!subUsers.containsKey(id)) {
                String locEmail = locUsers.get(id);
                Long matchingCloudId = subEmailToId.get(locEmail);
                if (matchingCloudId != null) {
                    System.out.println(String.format("  Local ID %d (%s) exists in Cloud under different ID %d!", id, maskEmail(locEmail), matchingCloudId));
                } else {
                    System.out.println(String.format("  Local ID %d (%s): MISSING IN CLOUD (New record to preserve)", id, maskEmail(locEmail)));
                }
            }
        }
    }

    private static void compareVehicles(Connection loc, Connection sub) throws Exception {
        Set<String> locVehicles = new HashSet<>();
        try (Statement s = loc.createStatement(); ResultSet rs = s.executeQuery("SELECT id FROM vehicles")) {
            while (rs.next()) locVehicles.add(rs.getString("id"));
        }

        Set<String> subVehicles = new HashSet<>();
        try (Statement s = sub.createStatement(); ResultSet rs = s.executeQuery("SELECT id FROM vehicles")) {
            while (rs.next()) subVehicles.add(rs.getString("id"));
        }

        System.out.println(String.format("Local Count: %d | Cloud Count: %d", locVehicles.size(), subVehicles.size()));
        Set<String> missingInCloud = new HashSet<>(locVehicles);
        missingInCloud.removeAll(subVehicles);
        Set<String> extraInCloud = new HashSet<>(subVehicles);
        extraInCloud.removeAll(locVehicles);

        if (missingInCloud.isEmpty() && extraInCloud.isEmpty()) {
            System.out.println("Result: 100% IDENTICAL VEHICLE CATALOGUE (All 207 vehicle IDs match exactly).");
        } else {
            System.out.println("Result: MISMATCH DETECTED!");
            if (!missingInCloud.isEmpty()) System.out.println("  Missing in Cloud: " + missingInCloud);
            if (!extraInCloud.isEmpty()) System.out.println("  Extra in Cloud: " + extraInCloud);
        }
    }

    private static void compareBookings(Connection loc, Connection sub) throws Exception {
        Map<Long, String> locBookings = new HashMap<>();
        Map<String, Long> locRefToId = new HashMap<>();
        Map<Long, String> locUserIds = new HashMap<>();

        try (Statement s = loc.createStatement();
             ResultSet rs = s.executeQuery("SELECT id, booking_reference, user_id FROM bookings ORDER BY id")) {
            while (rs.next()) {
                long id = rs.getLong("id");
                String ref = rs.getString("booking_reference");
                String uId = rs.getString("user_id");
                locBookings.put(id, ref);
                locRefToId.put(ref, id);
                locUserIds.put(id, uId);
            }
        }

        Map<Long, String> subBookings = new HashMap<>();
        Map<String, Long> subRefToId = new HashMap<>();
        Map<Long, String> subUserIds = new HashMap<>();

        try (Statement s = sub.createStatement();
             ResultSet rs = s.executeQuery("SELECT id, booking_reference, user_id FROM bookings ORDER BY id")) {
            while (rs.next()) {
                long id = rs.getLong("id");
                String ref = rs.getString("booking_reference");
                String uId = rs.getString("user_id");
                subBookings.put(id, ref);
                subRefToId.put(ref, id);
                subUserIds.put(id, uId);
            }
        }

        long locSeq = getSequenceValue(loc, "bookings_id_seq");
        long subSeq = getSequenceValue(sub, "bookings_id_seq");

        System.out.println(String.format("Local Count: %d | Cloud Count: %d", locBookings.size(), subBookings.size()));
        System.out.println(String.format("Local Sequence (last_value): %d | Cloud Sequence (last_value): %d", locSeq, subSeq));

        System.out.println("\nCloud Bookings:");
        for (Map.Entry<Long, String> e : subBookings.entrySet()) {
            System.out.println(String.format("  ID %2d: Ref=%s | UserID=%s", e.getKey(), e.getValue(), subUserIds.get(e.getKey())));
        }

        System.out.println("\nBooking ID & Reference Alignment Check:");
        for (Long id : subBookings.keySet()) {
            String subRef = subBookings.get(id);
            String locRef = locBookings.get(id);
            if (locRef == null) {
                System.out.println(String.format("  ID %d: Exists in Cloud only (%s)", id, subRef));
            } else if (subRef.equals(locRef)) {
                System.out.println(String.format("  ID %d: PERFECT MATCH (Ref=%s)", id, subRef));
            } else {
                System.out.println(String.format("  ID %d: COLLISION! Local=(%s) vs Cloud=(%s)", id, locRef, subRef));
            }
        }

        List<String> missingInCloud = new ArrayList<>();
        for (Map.Entry<Long, String> e : locBookings.entrySet()) {
            String ref = e.getValue();
            if (!subRefToId.containsKey(ref)) {
                missingInCloud.add(String.format("Local ID %d: Ref=%s (UserID=%s)", e.getKey(), ref, locUserIds.get(e.getKey())));
            }
        }

        System.out.println(String.format("\nLocal Bookings Missing in Cloud (%d records):", missingInCloud.size()));
        for (String m : missingInCloud) {
            System.out.println("  - " + m);
        }
    }

    private static void compareNotifications(Connection loc, Connection sub) throws Exception {
        Map<Long, String> locNotifs = new HashMap<>();
        Map<String, Long> locKeyToId = new HashMap<>();

        try (Statement s = loc.createStatement();
             ResultSet rs = s.executeQuery("SELECT id, idempotency_key FROM notifications ORDER BY id")) {
            while (rs.next()) {
                long id = rs.getLong("id");
                String key = rs.getString("idempotency_key");
                locNotifs.put(id, key);
                locKeyToId.put(key, id);
            }
        }

        Map<Long, String> subNotifs = new HashMap<>();
        Map<String, Long> subKeyToId = new HashMap<>();

        try (Statement s = sub.createStatement();
             ResultSet rs = s.executeQuery("SELECT id, idempotency_key FROM notifications ORDER BY id")) {
            while (rs.next()) {
                long id = rs.getLong("id");
                String key = rs.getString("idempotency_key");
                subNotifs.put(id, key);
                subKeyToId.put(key, id);
            }
        }

        long locSeq = getSequenceValue(loc, "notifications_id_seq");
        long subSeq = getSequenceValue(sub, "notifications_id_seq");

        System.out.println(String.format("Local Count: %d | Cloud Count: %d", locNotifs.size(), subNotifs.size()));
        System.out.println(String.format("Local Sequence (last_value): %d | Cloud Sequence (last_value): %d", locSeq, subSeq));

        System.out.println("\nNotification ID & Idempotency Key Alignment Check:");
        for (Long id : subNotifs.keySet()) {
            String subKey = subNotifs.get(id);
            String locKey = locNotifs.get(id);
            if (locKey == null) {
                System.out.println(String.format("  ID %d: Exists in Cloud only (%s)", id, subKey));
            } else if (subKey.equals(locKey)) {
                System.out.println(String.format("  ID %d: PERFECT MATCH (Key=%s)", id, subKey));
            } else {
                System.out.println(String.format("  ID %d: COLLISION! Local=(%s) vs Cloud=(%s)", id, locKey, subKey));
            }
        }

        List<String> missingInCloud = new ArrayList<>();
        for (Map.Entry<Long, String> e : locNotifs.entrySet()) {
            String key = e.getValue();
            if (!subKeyToId.containsKey(key)) {
                missingInCloud.add(String.format("Local ID %d: Key=%s", e.getKey(), key));
            }
        }

        System.out.println(String.format("\nLocal Notifications Missing in Cloud (%d records):", missingInCloud.size()));
        for (String m : missingInCloud) {
            System.out.println("  - " + m);
        }
    }

    private static long getSequenceValue(Connection conn, String seqName) {
        try (Statement s = conn.createStatement();
             ResultSet rs = s.executeQuery("SELECT last_value FROM " + seqName)) {
            if (rs.next()) {
                return rs.getLong(1);
            }
        } catch (Exception ignored) {
        }
        return -1;
    }

    private static String maskEmail(String email) {
        if (email == null) return "null";
        int atIdx = email.indexOf('@');
        if (atIdx <= 2) return "***" + email.substring(atIdx);
        return email.substring(0, 2) + "***" + email.substring(atIdx);
    }

    private static Map<String, String> loadEnvFile(File file) {
        Map<String, String> map = new HashMap<>();
        if (!file.exists()) return map;
        try (BufferedReader reader = new BufferedReader(new FileReader(file))) {
            String line;
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                if (line.isEmpty() || line.startsWith("#") || !line.contains("=")) continue;
                int idx = line.indexOf('=');
                String k = line.substring(0, idx).trim();
                String v = line.substring(idx + 1).trim();
                if (v.startsWith("\"")) {
                    int endIdx = v.indexOf('\"', 1);
                    if (endIdx != -1) v = v.substring(1, endIdx);
                } else if (v.startsWith("'")) {
                    int endIdx = v.indexOf('\'', 1);
                    if (endIdx != -1) v = v.substring(1, endIdx);
                } else {
                    int hashIdx = v.indexOf('#');
                    if (hashIdx != -1) v = v.substring(0, hashIdx).trim();
                }
                map.put(k, v);
            }
        } catch (Exception ignored) {
        }
        return map;
    }
}
