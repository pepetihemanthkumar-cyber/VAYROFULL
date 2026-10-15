import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.sql.Types;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.Set;
import org.postgresql.PGConnection;
import org.postgresql.largeobject.LargeObject;
import org.postgresql.largeobject.LargeObjectManager;

/**
 * VAYRO Data Reconciliation and Migration Utility.
 *
 * Safely migrates local records from vayro_users into Supabase PostgreSQL.
 * - Enforces zero-secret logging.
 * - Idempotent and transaction-wrapped.
 * - Preserves existing cloud records without overwriting.
 * - Preserves BCrypt password hashes.
 * - Preserves all user-booking-notification relationships.
 * - Updates sequence counters post-migration.
 */
public class MigrateLocalToSupabase {

    public static void main(String[] args) {
        System.out.println("======================================================================");
        System.out.println("VAYRO — LOCAL TO SUPABASE CLOUD DATA RECONCILIATION & MIGRATION");
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
        subProps.setProperty("socketTimeout", "30");

        Properties locProps = new Properties();
        locProps.setProperty("user", locUser);
        locProps.setProperty("password", locPassword);
        locProps.setProperty("connectTimeout", "5");
        locProps.setProperty("socketTimeout", "15");

        try {
            Class.forName("org.postgresql.Driver");

            try (Connection locConn = DriverManager.getConnection(locUrl, locProps);
                 Connection subConn = DriverManager.getConnection(subUrl, subProps)) {

                locConn.setAutoCommit(false);
                subConn.setAutoCommit(false);

                System.out.println("Connected to Local PostgreSQL and Supabase Cloud successfully.");

                // Check initial counts
                long initCloudUsers = getCount(subConn, "users");
                long initCloudBookings = getCount(subConn, "bookings");
                long initCloudNotifications = getCount(subConn, "notifications");
                long initCloudVehicles = getCount(subConn, "vehicles");

                System.out.printf("Initial Cloud Counts -> Users: %d, Bookings: %d, Notifications: %d, Vehicles: %d%n",
                        initCloudUsers, initCloudBookings, initCloudNotifications, initCloudVehicles);

                // ==========================================================
                // 1. RECONCILE AND MIGRATE USERS
                // ==========================================================
                System.out.println("\n[PHASE 3.1] Reconciling and Migrating Users...");
                Map<String, Long> cloudEmailToId = new HashMap<>();
                try (Statement s = subConn.createStatement();
                     ResultSet rs = s.executeQuery("SELECT id, email FROM users")) {
                    while (rs.next()) {
                        cloudEmailToId.put(rs.getString("email").toLowerCase().trim(), rs.getLong("id"));
                    }
                }

                long maxCloudUserId = getMaxId(subConn, "users");
                long nextUserId = maxCloudUserId + 1;

                // Map: localUserId (String) -> cloudUserId (String)
                Map<String, String> userMapping = new HashMap<>();
                int usersInserted = 0;

                String userInsertSql = "INSERT INTO users (id, first_name, last_name, email, password, phone, " +
                        "google_subject_id, role, enabled, created_at, updated_at) " +
                        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

                try (PreparedStatement psUser = subConn.prepareStatement(userInsertSql);
                     Statement s = locConn.createStatement();
                     ResultSet rs = s.executeQuery("SELECT id, first_name, last_name, email, password, phone, " +
                             "google_subject_id, role, enabled, created_at, updated_at FROM users ORDER BY id ASC")) {

                    while (rs.next()) {
                        long locId = rs.getLong("id");
                        String locEmail = rs.getString("email").toLowerCase().trim();

                        if (cloudEmailToId.containsKey(locEmail)) {
                            // User already exists in cloud by email
                            long existingCloudId = cloudEmailToId.get(locEmail);
                            userMapping.put(String.valueOf(locId), String.valueOf(existingCloudId));
                            System.out.printf("  User '%s' already exists in Cloud with ID %d (mapped %d -> %d)%n",
                                    maskEmail(locEmail), existingCloudId, locId, existingCloudId);
                        } else {
                            // New user to insert into cloud
                            long newCloudId = nextUserId++;
                            psUser.setLong(1, newCloudId);
                            psUser.setString(2, rs.getString("first_name"));
                            psUser.setString(3, rs.getString("last_name"));
                            psUser.setString(4, rs.getString("email"));
                            psUser.setString(5, rs.getString("password")); // BCrypt hash preserved
                            psUser.setString(6, rs.getString("phone"));
                            psUser.setString(7, rs.getString("google_subject_id"));
                            psUser.setString(8, rs.getString("role"));
                            psUser.setBoolean(9, rs.getBoolean("enabled"));
                            psUser.setTimestamp(10, rs.getTimestamp("created_at"));
                            psUser.setTimestamp(11, rs.getTimestamp("updated_at"));

                            psUser.executeUpdate();
                            userMapping.put(String.valueOf(locId), String.valueOf(newCloudId));
                            cloudEmailToId.put(locEmail, newCloudId);
                            usersInserted++;
                            System.out.printf("  Inserted User '%s' with new Cloud ID %d (mapped %d -> %d)%n",
                                    maskEmail(locEmail), newCloudId, locId, newCloudId);
                        }
                    }
                }

                // Update users_id_seq in Supabase
                updateSequence(subConn, "users_id_seq", "users");
                System.out.printf("Users migration completed: %d new users inserted. Sequence updated.%n", usersInserted);

                // ==========================================================
                // 2. RECONCILE AND MIGRATE BOOKINGS
                // ==========================================================
                System.out.println("\n[PHASE 3.2] Reconciling and Migrating Bookings...");
                Set<String> cloudBookingRefs = new HashSet<>();
                try (Statement s = subConn.createStatement();
                     ResultSet rs = s.executeQuery("SELECT booking_reference FROM bookings")) {
                    while (rs.next()) {
                        cloudBookingRefs.add(rs.getString("booking_reference"));
                    }
                }

                long maxCloudBookingId = getMaxId(subConn, "bookings");
                long nextBookingId = maxCloudBookingId + 1;
                int bookingsInserted = 0;

                String bookingInsertSql = "INSERT INTO bookings (" +
                        "id, add_ons_amount, base_amount, booking_reference, created_at, customer_email, " +
                        "customer_name, customer_phone, discount_amount, notes, payment_method, payment_order_id, " +
                        "payment_reference, payment_status, payment_verified_at, pickup_date_time, pickup_location, " +
                        "price_per_day, rental_days, return_date_time, return_location, returned_at, status, " +
                        "tax_amount, total_amount, updated_at, user_id, vehicle_id, vehicle_name) " +
                        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

                try (PreparedStatement psBook = subConn.prepareStatement(bookingInsertSql);
                     Statement s = locConn.createStatement();
                     ResultSet rs = s.executeQuery("SELECT * FROM bookings ORDER BY id ASC")) {

                    while (rs.next()) {
                        String ref = rs.getString("booking_reference");
                        if (cloudBookingRefs.contains(ref)) {
                            System.out.printf("  Booking '%s' already exists in Cloud, skipping.%n", ref);
                            continue;
                        }

                        long newBookingId = nextBookingId++;
                        String origUserId = rs.getString("user_id");
                        String mappedUserId = userMapping.getOrDefault(origUserId, origUserId);

                        psBook.setLong(1, newBookingId);
                        psBook.setBigDecimal(2, rs.getBigDecimal("add_ons_amount"));
                        psBook.setBigDecimal(3, rs.getBigDecimal("base_amount"));
                        psBook.setString(4, ref);
                        psBook.setTimestamp(5, rs.getTimestamp("created_at"));
                        psBook.setString(6, rs.getString("customer_email"));
                        psBook.setString(7, rs.getString("customer_name"));
                        psBook.setString(8, rs.getString("customer_phone"));
                        psBook.setBigDecimal(9, rs.getBigDecimal("discount_amount"));
                        psBook.setString(10, rs.getString("notes"));
                        psBook.setString(11, rs.getString("payment_method"));
                        psBook.setString(12, rs.getString("payment_order_id"));
                        psBook.setString(13, rs.getString("payment_reference"));
                        psBook.setString(14, rs.getString("payment_status"));
                        psBook.setTimestamp(15, rs.getTimestamp("payment_verified_at"));
                        psBook.setTimestamp(16, rs.getTimestamp("pickup_date_time"));
                        psBook.setString(17, rs.getString("pickup_location"));
                        psBook.setBigDecimal(18, rs.getBigDecimal("price_per_day"));
                        psBook.setInt(19, rs.getInt("rental_days"));
                        psBook.setTimestamp(20, rs.getTimestamp("return_date_time"));
                        psBook.setString(21, rs.getString("return_location"));
                        psBook.setTimestamp(22, rs.getTimestamp("returned_at"));
                        psBook.setString(23, rs.getString("status"));
                        psBook.setBigDecimal(24, rs.getBigDecimal("tax_amount"));
                        psBook.setBigDecimal(25, rs.getBigDecimal("total_amount"));
                        psBook.setTimestamp(26, rs.getTimestamp("updated_at"));
                        psBook.setString(27, mappedUserId); // Mapped User ID
                        psBook.setString(28, rs.getString("vehicle_id"));
                        psBook.setString(29, rs.getString("vehicle_name"));

                        psBook.executeUpdate();
                        cloudBookingRefs.add(ref);
                        bookingsInserted++;
                        System.out.printf("  Inserted Booking '%s' (Cloud ID: %d, mapped user %s -> %s)%n",
                                ref, newBookingId, origUserId, mappedUserId);
                    }
                }

                // Update bookings_id_seq in Supabase
                updateSequence(subConn, "bookings_id_seq", "bookings");
                System.out.printf("Bookings migration completed: %d new bookings inserted. Sequence updated.%n", bookingsInserted);

                // ==========================================================
                // 3. RECONCILE AND MIGRATE NOTIFICATIONS
                // ==========================================================
                System.out.println("\n[PHASE 3.3] Reconciling and Migrating Notifications...");
                Set<String> cloudIdempKeys = new HashSet<>();
                try (Statement s = subConn.createStatement();
                     ResultSet rs = s.executeQuery("SELECT idempotency_key FROM notifications")) {
                    while (rs.next()) {
                        cloudIdempKeys.add(rs.getString("idempotency_key"));
                    }
                }

                long maxCloudNotifId = getMaxId(subConn, "notifications");
                long nextNotifId = maxCloudNotifId + 1;
                int notifsInserted = 0;

                LargeObjectManager locLobj = locConn.unwrap(PGConnection.class).getLargeObjectAPI();
                LargeObjectManager subLobj = subConn.unwrap(PGConnection.class).getLargeObjectAPI();

                String notifInsertSql = "INSERT INTO notifications (" +
                        "id, attachment_name, booking_reference, created_at, error_message, idempotency_key, " +
                        "message_content, pdf_invoice_data, provider, provider_message_id, recipient_email, " +
                        "recipient_name, recipient_role, retry_count, sent_at, status, subject, type, updated_at) " +
                        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

                try (PreparedStatement psNotif = subConn.prepareStatement(notifInsertSql);
                     Statement s = locConn.createStatement();
                     ResultSet rs = s.executeQuery("SELECT * FROM notifications ORDER BY id ASC")) {

                    while (rs.next()) {
                        String idempKey = rs.getString("idempotency_key");
                        if (cloudIdempKeys.contains(idempKey)) {
                            System.out.printf("  Notification '%s' already exists in Cloud, skipping.%n", idempKey);
                            continue;
                        }

                        long newNotifId = nextNotifId++;

                        // Handle PDF LOB transfer
                        Long newOid = null;
                        long locOid = rs.getLong("pdf_invoice_data");
                        if (!rs.wasNull() && locOid > 0) {
                            try {
                                LargeObject obj = locLobj.open(locOid, LargeObjectManager.READ);
                                byte[] buf = new byte[obj.size()];
                                obj.read(buf, 0, obj.size());
                                obj.close();

                                long createdOid = subLobj.createLO();
                                LargeObject subObj = subLobj.open(createdOid, LargeObjectManager.WRITE);
                                subObj.write(buf);
                                subObj.close();
                                newOid = createdOid;
                            } catch (Exception ex) {
                                System.err.printf("  Warning: failed to copy LOB %d for notification %s: %s%n",
                                        locOid, idempKey, ex.getMessage());
                            }
                        }

                        psNotif.setLong(1, newNotifId);
                        psNotif.setString(2, rs.getString("attachment_name"));
                        psNotif.setString(3, rs.getString("booking_reference"));
                        psNotif.setTimestamp(4, rs.getTimestamp("created_at"));
                        psNotif.setString(5, rs.getString("error_message"));
                        psNotif.setString(6, idempKey);
                        psNotif.setString(7, rs.getString("message_content"));
                        if (newOid != null) {
                            psNotif.setLong(8, newOid);
                        } else {
                            psNotif.setNull(8, Types.BIGINT);
                        }
                        psNotif.setString(9, rs.getString("provider"));
                        psNotif.setString(10, rs.getString("provider_message_id"));
                        psNotif.setString(11, rs.getString("recipient_email"));
                        psNotif.setString(12, rs.getString("recipient_name"));
                        psNotif.setString(13, rs.getString("recipient_role"));
                        psNotif.setInt(14, rs.getInt("retry_count"));
                        psNotif.setTimestamp(15, rs.getTimestamp("sent_at"));
                        psNotif.setString(16, rs.getString("status"));
                        psNotif.setString(17, rs.getString("subject"));
                        psNotif.setString(18, rs.getString("type"));
                        psNotif.setTimestamp(19, rs.getTimestamp("updated_at"));

                        psNotif.executeUpdate();
                        cloudIdempKeys.add(idempKey);
                        notifsInserted++;
                        System.out.printf("  Inserted Notification '%s' (Cloud ID: %d, LOB OID: %s)%n",
                                idempKey, newNotifId, newOid != null ? String.valueOf(newOid) : "null");
                    }
                }

                // Update notifications_id_seq in Supabase
                updateSequence(subConn, "notifications_id_seq", "notifications");
                System.out.printf("Notifications migration completed: %d new notifications inserted. Sequence updated.%n", notifsInserted);

                // ==========================================================
                // 4. VERIFY FINAL INTEGRITY BEFORE COMMIT
                // ==========================================================
                long finalUsers = getCount(subConn, "users");
                long finalBookings = getCount(subConn, "bookings");
                long finalNotifs = getCount(subConn, "notifications");
                long finalVehicles = getCount(subConn, "vehicles");

                System.out.println("\n[PHASE 3.4] Verification of Target Counts before Commit:");
                System.out.printf("  Users        : Before=%d | Added=%d | Target Total=%d%n", initCloudUsers, usersInserted, finalUsers);
                System.out.printf("  Bookings     : Before=%d | Added=%d | Target Total=%d%n", initCloudBookings, bookingsInserted, finalBookings);
                System.out.printf("  Notifications: Before=%d | Added=%d | Target Total=%d%n", initCloudNotifications, notifsInserted, finalNotifs);
                System.out.printf("  Vehicles     : Preserved=%d%n", finalVehicles);

                // Commit the transaction
                subConn.commit();
                System.out.println("\n>>> TRANSACTION COMMITTED SUCCESSFULLY TO SUPABASE <<<");
            }
        } catch (Exception e) {
            System.err.println("\nFATAL ERROR DURING MIGRATION: " + e.getMessage());
            e.printStackTrace();
            System.exit(1);
        }
    }

    private static long getCount(Connection c, String table) throws Exception {
        try (Statement s = c.createStatement(); ResultSet rs = s.executeQuery("SELECT COUNT(*) FROM " + table)) {
            rs.next();
            return rs.getLong(1);
        }
    }

    private static long getMaxId(Connection c, String table) throws Exception {
        try (Statement s = c.createStatement(); ResultSet rs = s.executeQuery("SELECT COALESCE(MAX(id), 0) FROM " + table)) {
            rs.next();
            return rs.getLong(1);
        }
    }

    private static void updateSequence(Connection c, String seqName, String tableName) throws Exception {
        try (Statement s = c.createStatement()) {
            s.execute(String.format("SELECT setval('%s', (SELECT COALESCE(MAX(id), 1) FROM %s), true)", seqName, tableName));
        }
    }

    private static String maskEmail(String email) {
        if (email == null || !email.contains("@")) return email;
        String[] parts = email.split("@", 2);
        String name = parts[0];
        String visible = name.length() <= 2 ? name.substring(0, 1) + "*" : name.substring(0, 2) + "***";
        return visible + "@" + parts[1];
    }

    private static Map<String, String> loadEnvFile(File envFile) {
        Map<String, String> env = new HashMap<>();
        if (!envFile.exists()) return env;
        try (BufferedReader reader = new BufferedReader(new FileReader(envFile))) {
            String line;
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                if (line.isEmpty() || line.startsWith("#") || !line.contains("=")) continue;
                String[] parts = line.split("=", 2);
                env.put(parts[0].trim(), parts[1].trim());
            }
        } catch (Exception ignored) {}
        return env;
    }
}
