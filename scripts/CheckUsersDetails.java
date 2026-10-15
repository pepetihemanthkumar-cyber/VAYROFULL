import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.HashMap;
import java.util.Map;
import java.util.Properties;

public class CheckUsersDetails {
    public static void main(String[] args) throws Exception {
        Map<String, String> env = new HashMap<>();
        try (BufferedReader br = new BufferedReader(new FileReader(".env"))) {
            String line;
            while ((line = br.readLine()) != null) {
                line = line.trim();
                if (line.isEmpty() || line.startsWith("#") || !line.contains("=")) continue;
                String[] p = line.split("=", 2);
                env.put(p[0].trim(), p[1].trim());
            }
        }
        String subHost = env.get("SUPABASE_DB_HOST");
        String subPort = env.get("SUPABASE_DB_PORT");
        String subDb = env.get("SUPABASE_DB_NAME");
        String subUser = env.get("SUPABASE_DB_USERNAME");
        String subPass = env.get("SUPABASE_DB_PASSWORD");
        String subUrl = "jdbc:postgresql://" + subHost + ":" + subPort + "/" + subDb + "?sslmode=require";

        String locHost = env.getOrDefault("DB_HOST", "localhost");
        String locPort = env.getOrDefault("DB_PORT", "5432");
        String locDb = env.getOrDefault("DB_NAME", "vayro_users");
        String locUser = env.getOrDefault("DB_USERNAME", "pepetihemanthkumar");
        String locPass = env.getOrDefault("DB_PASSWORD", "");
        String locUrl = "jdbc:postgresql://" + locHost + ":" + locPort + "/" + locDb;

        Properties sp = new Properties();
        sp.setProperty("user", subUser);
        sp.setProperty("password", subPass);
        sp.setProperty("sslmode", "require");
        sp.setProperty("readOnly", "true");

        Properties lp = new Properties();
        lp.setProperty("user", locUser);
        lp.setProperty("password", locPass);
        lp.setProperty("readOnly", "true");

        try (Connection lc = DriverManager.getConnection(locUrl, lp);
             Connection sc = DriverManager.getConnection(subUrl, sp)) {
            System.out.println("=== LOCAL USERS ===");
            try (Statement s = lc.createStatement(); ResultSet rs = s.executeQuery("SELECT id, email, first_name, last_name, role, enabled FROM users ORDER BY id")) {
                while (rs.next()) {
                    System.out.printf("Local User ID=%2d | Email=%-28s | Name=%-20s | Role=%-5s | Enabled=%b%n",
                        rs.getLong("id"), rs.getString("email"), rs.getString("first_name") + " " + rs.getString("last_name"), rs.getString("role"), rs.getBoolean("enabled"));
                }
            }

            System.out.println("\n=== CLOUD USERS ===");
            try (Statement s = sc.createStatement(); ResultSet rs = s.executeQuery("SELECT id, email, first_name, last_name, role, enabled FROM users ORDER BY id")) {
                while (rs.next()) {
                    System.out.printf("Cloud User ID=%2d | Email=%-28s | Name=%-20s | Role=%-5s | Enabled=%b%n",
                        rs.getLong("id"), rs.getString("email"), rs.getString("first_name") + " " + rs.getString("last_name"), rs.getString("role"), rs.getBoolean("enabled"));
                }
            }

            System.out.println("\n=== LOCAL BOOKINGS ===");
            try (Statement s = lc.createStatement(); ResultSet rs = s.executeQuery("SELECT id, booking_reference, user_id, customer_email, vehicle_id, status, payment_status FROM bookings ORDER BY id")) {
                while (rs.next()) {
                    System.out.printf("Local Booking ID=%2d | Ref=%-25s | UserID=%-3s | Email=%-28s | Veh=%-18s | Status=%-9s | Pay=%s%n",
                        rs.getLong("id"), rs.getString("booking_reference"), rs.getString("user_id"), rs.getString("customer_email"), rs.getString("vehicle_id"), rs.getString("status"), rs.getString("payment_status"));
                }
            }

            System.out.println("\n=== LATEST CLOUD BOOKINGS (READ-ONLY DIRECT SQL) ===");
            try (Statement s = sc.createStatement(); ResultSet rs = s.executeQuery(
                    "SELECT id, booking_reference, user_id, customer_email, vehicle_id, status, payment_status, total_amount " +
                    "FROM bookings ORDER BY id DESC LIMIT 5")) {
                while (rs.next()) {
                    System.out.printf("Cloud Booking ID=%2d | Ref=%-25s | UserID=%-3s | Email=%-35s | Status=%-9s | Pay=%-7s | Total=₹%.2f%n",
                        rs.getLong("id"), rs.getString("booking_reference"), rs.getString("user_id"), rs.getString("customer_email"),
                        rs.getString("status"), rs.getString("payment_status"), rs.getDouble("total_amount"));
                }
            }
        }
    }
}
