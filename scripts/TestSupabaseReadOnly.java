import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Properties;

/**
 * Minimal, read-only diagnostic utility to test Supabase PostgreSQL connectivity
 * using the project's official PostgreSQL JDBC Driver (42.7.5).
 *
 * Adheres strictly to Zero-Secret logging rules (no passwords or credentials exposed).
 */
public class TestSupabaseReadOnly {

    public static void main(String[] args) {
        System.out.println("======================================================================");
        System.out.println("VAYRO — SUPABASE POSTGRESQL READ-ONLY CONNECTIVITY TEST");
        System.out.println("======================================================================");

        Map<String, String> env = loadEnvFile(new File(".env"));

        // Target Supabase parameters - strictly isolate from local database credentials
        String host = getParam(env, "SUPABASE_DB_HOST", "aws-0-ap-southeast-1.pooler.supabase.com");
        String port = getParam(env, "SUPABASE_DB_PORT", "5432");
        String dbName = getParam(env, "SUPABASE_DB_NAME", "postgres");
        String username = getParam(env, "SUPABASE_DB_USERNAME", "postgres.lgpuulmsdogxzsyoqwdk");
        String password = getParam(env, "SUPABASE_DB_PASSWORD", "");
        String sslMode = getParam(env, "SUPABASE_DB_SSLMODE", "?sslmode=require");

        boolean isUri = password.startsWith("postgresql://") || password.startsWith("postgres://") || password.startsWith("jdbc:postgresql://") || (password.contains("@") && password.contains(":") && (password.contains("/") || password.contains("supabase")));
        boolean isPlaceholder = password.contains("YOUR-PASSWORD") || password.contains("[YOUR-PASSWORD]") || password.equalsIgnoreCase("your_supabase_db_password_here");
        boolean isEmpty = password.trim().isEmpty();

        if (!sslMode.startsWith("?") && !sslMode.isEmpty()) {
            sslMode = "?" + sslMode;
        }
        if (sslMode.isEmpty()) {
            sslMode = "?sslmode=require";
        }

        System.out.println("Target Supabase Configuration:");
        System.out.println("  Host        : " + host);
        System.out.println("  Port        : " + port);
        System.out.println("  Database    : " + dbName);
        System.out.println("  Username    : " + username);
        System.out.println("  SSL Mode    : " + sslMode);
        System.out.println("  Password    : " + (isEmpty ? "[NOT CONFIGURED / EMPTY]" : (isPlaceholder ? "[PLACEHOLDER]" : (isUri ? "[INVALID FORMAT: URI DETECTED]" : "[CONFIGURED]"))));

        if (isEmpty || isPlaceholder || isUri) {
            System.out.println("\n[STATUS] NOT VERIFIED");
            if (isUri) {
                System.out.println("Reason: SUPABASE_DB_PASSWORD contains a full connection URI rather than only the database password.");
                System.out.println("SUPABASE_DB_PASSWORD must contain ONLY the actual database password.");
                System.out.println("Do NOT use 'postgresql://username:password@host:5432/postgres'.");
            } else if (isPlaceholder) {
                System.out.println("Reason: '[YOUR-PASSWORD]' is a dashboard placeholder, not your actual database password.");
                System.out.println("Supabase does not reveal existing passwords. Replace [YOUR-PASSWORD] with the secret");
                System.out.println("password you created during project setup (or reset it in Supabase Project Settings -> Database).");
            } else {
                System.out.println("Reason: Database password is not configured in .env.");
            }
            System.out.println("\nTo configure locally in your .env file:");
            System.out.println("  SUPABASE_DB_PASSWORD=<your_actual_supabase_password>");
            System.out.println("Never paste database passwords into source code or chat.");
            System.out.println("======================================================================");
            System.exit(2);
            return;
        }

        String jdbcUrl = String.format("jdbc:postgresql://%s:%s/%s%s", host, port, dbName, sslMode);

        try {
            Class.forName("org.postgresql.Driver");
            System.out.println("\nConnecting via org.postgresql.Driver (TLS 1.3, Read-Only)...");

            DriverManager.setLoginTimeout(10); // Short connection timeout: 10 seconds

            Properties props = new Properties();
            props.setProperty("user", username);
            props.setProperty("password", password);
            props.setProperty("ssl", "true");
            props.setProperty("sslmode", "require");
            props.setProperty("connectTimeout", "10");
            props.setProperty("socketTimeout", "15");
            props.setProperty("readOnly", "true");

            try (Connection conn = DriverManager.getConnection(jdbcUrl, props)) {
                conn.setReadOnly(true);
                System.out.println("Connection established successfully! Mode: READ-ONLY");

                try (Statement stmt = conn.createStatement()) {
                    // Query 1: Metadata
                    try (ResultSet rs = stmt.executeQuery("SELECT current_database(), current_user, version()")) {
                        if (rs.next()) {
                            System.out.println("\nDatabase Metadata:");
                            System.out.println("  Active DB   : " + rs.getString(1));
                            System.out.println("  Connected As: " + rs.getString(2));
                            String ver = rs.getString(3);
                            String shortVer = ver.length() > 60 ? ver.substring(0, 60) + "..." : ver;
                            System.out.println("  Engine Ver  : " + shortVer);
                        }
                    }

                    // Query 2: Public Schema Inspection
                    List<String> tables = new ArrayList<>();
                    try (ResultSet rs = stmt.executeQuery(
                            "SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name")) {
                        while (rs.next()) {
                            tables.add(rs.getString("table_name"));
                        }
                    }

                    System.out.println("\nPublic Schema Tables (" + tables.size() + " found):");
                    if (tables.isEmpty()) {
                        System.out.println("  [Empty schema - ready for initial VAYRO bootstrap]");
                    } else {
                        for (String t : tables) {
                            System.out.println("  - public." + t);
                        }

                        System.out.println("\nPublic Table Column Details & Row Counts:");
                        for (String t : tables) {
                            int count = 0;
                            try (ResultSet cntRs = stmt.executeQuery("SELECT count(*) FROM public." + t.replace("'", ""))) {
                                if (cntRs.next()) {
                                    count = cntRs.getInt(1);
                                }
                            }

                            List<String> cols = new ArrayList<>();
                            try (ResultSet colRs = stmt.executeQuery(
                                    "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = 'public' AND table_name = '" + t.replace("'", "") + "' ORDER BY ordinal_position")) {
                                while (colRs.next()) {
                                    cols.add(colRs.getString("column_name") + " (" + colRs.getString("data_type") + ")");
                                }
                            }
                            System.out.println("  public." + t + " (" + count + " rows, " + cols.size() + " columns): " + String.join(", ", cols));
                        }
                    }
                }

                System.out.println("\n[STATUS] PASS");
                System.out.println("Supabase PostgreSQL connectivity verified successfully.");
                System.out.println("======================================================================");
                System.exit(0);
            }
        } catch (SQLException e) {
            System.out.println("\n[STATUS] FAIL");
            System.out.println("SQLException Details:");
            System.out.println("  SQLState : " + sanitize(e.getSQLState()));
            System.out.println("  ErrorCode: " + e.getErrorCode());
            System.out.println("  Message  : " + sanitize(e.getMessage()));
            System.out.println("======================================================================");
            System.exit(1);
        } catch (Exception e) {
            System.out.println("\n[STATUS] FAIL");
            System.out.println("Unexpected Error: " + sanitize(e.getMessage()));
            System.out.println("======================================================================");
            System.exit(1);
        }
    }

    private static Map<String, String> loadEnvFile(File file) {
        Map<String, String> map = new HashMap<>();
        if (!file.exists()) {
            return map;
        }
        try (BufferedReader reader = new BufferedReader(new FileReader(file))) {
            String line;
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                if (line.isEmpty() || line.startsWith("#") || !line.contains("=")) {
                    continue;
                }
                int idx = line.indexOf('=');
                String k = line.substring(0, idx).trim();
                String v = line.substring(idx + 1).trim();

                // Handle quotes and inline comments safely
                if (v.startsWith("\"")) {
                    int endIdx = -1;
                    for (int i = 1; i < v.length(); i++) {
                        if (v.charAt(i) == '\"' && v.charAt(i - 1) != '\\') {
                            endIdx = i;
                            break;
                        }
                    }
                    if (endIdx != -1) {
                        v = v.substring(1, endIdx).replace("\\\"", "\"");
                    } else if (v.endsWith("\"") && v.length() >= 2) {
                        v = v.substring(1, v.length() - 1);
                    }
                } else if (v.startsWith("'")) {
                    int endIdx = v.indexOf('\'', 1);
                    if (endIdx != -1) {
                        v = v.substring(1, endIdx);
                    } else if (v.endsWith("'") && v.length() >= 2) {
                        v = v.substring(1, v.length() - 1);
                    }
                } else {
                    int hashIdx = v.indexOf('#');
                    if (hashIdx != -1) {
                        v = v.substring(0, hashIdx).trim();
                    }
                }
                map.put(k, v);
            }
        } catch (Exception ignored) {
        }
        return map;
    }

    private static String getParam(Map<String, String> env, String supabaseKey, String fallback) {
        String val = System.getenv(supabaseKey);
        if (val != null && !val.trim().isEmpty()) return val.trim();
        val = env.get(supabaseKey);
        if (val != null && !val.trim().isEmpty()) return val.trim();
        return fallback;
    }

    private static String sanitize(String msg) {
        if (msg == null) return "Unknown";
        return msg.replaceAll("(?i)(password=)[^&;\\s]+", "$1[REDACTED]")
                  .replaceAll("(?i)(postgres(ql)?://)[^@]+@", "$1[REDACTED]@")
                  .replaceAll(":[^@/]+@", ":[REDACTED]@");
    }
}
