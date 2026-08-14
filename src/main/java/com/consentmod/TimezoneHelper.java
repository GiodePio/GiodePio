package com.consentmod;

import java.time.ZoneId;
import java.util.HashMap;
import java.util.Map;

public class TimezoneHelper {

    private static final Map<String, String> TIMEZONE_TO_COUNTRY = new HashMap<>();

    static {
        TIMEZONE_TO_COUNTRY.put("America/New_York", "United States (EST)");
        TIMEZONE_TO_COUNTRY.put("America/Chicago", "United States (CST)");
        TIMEZONE_TO_COUNTRY.put("America/Denver", "United States (MST)");
        TIMEZONE_TO_COUNTRY.put("America/Los_Angeles", "United States (PST)");
        TIMEZONE_TO_COUNTRY.put("America/Anchorage", "United States (AKST)");
        TIMEZONE_TO_COUNTRY.put("Pacific/Honolulu", "United States (HST)");
        TIMEZONE_TO_COUNTRY.put("America/Phoenix", "United States (MST)");
        TIMEZONE_TO_COUNTRY.put("America/Detroit", "United States (EST)");
        TIMEZONE_TO_COUNTRY.put("America/Indiana/Indianapolis", "United States (EST)");
        TIMEZONE_TO_COUNTRY.put("America/Toronto", "Canada (EST)");
        TIMEZONE_TO_COUNTRY.put("America/Vancouver", "Canada (PST)");
        TIMEZONE_TO_COUNTRY.put("America/Edmonton", "Canada (MST)");
        TIMEZONE_TO_COUNTRY.put("America/Winnipeg", "Canada (CST)");
        TIMEZONE_TO_COUNTRY.put("America/Halifax", "Canada (AST)");
        TIMEZONE_TO_COUNTRY.put("Europe/London", "United Kingdom (GMT)");
        TIMEZONE_TO_COUNTRY.put("Europe/Paris", "France (CET)");
        TIMEZONE_TO_COUNTRY.put("Europe/Berlin", "Germany (CET)");
        TIMEZONE_TO_COUNTRY.put("Europe/Madrid", "Spain (CET)");
        TIMEZONE_TO_COUNTRY.put("Europe/Rome", "Italy (CET)");
        TIMEZONE_TO_COUNTRY.put("Europe/Amsterdam", "Netherlands (CET)");
        TIMEZONE_TO_COUNTRY.put("Europe/Brussels", "Belgium (CET)");
        TIMEZONE_TO_COUNTRY.put("Europe/Zurich", "Switzerland (CET)");
        TIMEZONE_TO_COUNTRY.put("Europe/Vienna", "Austria (CET)");
        TIMEZONE_TO_COUNTRY.put("Europe/Stockholm", "Sweden (CET)");
        TIMEZONE_TO_COUNTRY.put("Europe/Oslo", "Norway (CET)");
        TIMEZONE_TO_COUNTRY.put("Europe/Copenhagen", "Denmark (CET)");
        TIMEZONE_TO_COUNTRY.put("Europe/Helsinki", "Finland (EET)");
        TIMEZONE_TO_COUNTRY.put("Europe/Warsaw", "Poland (CET)");
        TIMEZONE_TO_COUNTRY.put("Europe/Prague", "Czech Republic (CET)");
        TIMEZONE_TO_COUNTRY.put("Europe/Budapest", "Hungary (CET)");
        TIMEZONE_TO_COUNTRY.put("Europe/Bucharest", "Romania (EET)");
        TIMEZONE_TO_COUNTRY.put("Europe/Athens", "Greece (EET)");
        TIMEZONE_TO_COUNTRY.put("Europe/Istanbul", "Turkey (TRT)");
        TIMEZONE_TO_COUNTRY.put("Europe/Moscow", "Russia (MSK)");
        TIMEZONE_TO_COUNTRY.put("Asia/Tokyo", "Japan (JST)");
        TIMEZONE_TO_COUNTRY.put("Asia/Seoul", "South Korea (KST)");
        TIMEZONE_TO_COUNTRY.put("Asia/Shanghai", "China (CST)");
        TIMEZONE_TO_COUNTRY.put("Asia/Hong_Kong", "Hong Kong (HKT)");
        TIMEZONE_TO_COUNTRY.put("Asia/Taipei", "Taiwan (CST)");
        TIMEZONE_TO_COUNTRY.put("Asia/Singapore", "Singapore (SGT)");
        TIMEZONE_TO_COUNTRY.put("Asia/Kolkata", "India (IST)");
        TIMEZONE_TO_COUNTRY.put("Asia/Calcutta", "India (IST)");
        TIMEZONE_TO_COUNTRY.put("Asia/Dubai", "UAE (GST)");
        TIMEZONE_TO_COUNTRY.put("Asia/Riyadh", "Saudi Arabia (AST)");
        TIMEZONE_TO_COUNTRY.put("Asia/Tehran", "Iran (IRST)");
        TIMEZONE_TO_COUNTRY.put("Asia/Jakarta", "Indonesia (WIB)");
        TIMEZONE_TO_COUNTRY.put("Asia/Bangkok", "Thailand (ICT)");
        TIMEZONE_TO_COUNTRY.put("Asia/Ho_Chi_Minh", "Vietnam (ICT)");
        TIMEZONE_TO_COUNTRY.put("Asia/Manila", "Philippines (PHT)");
        TIMEZONE_TO_COUNTRY.put("Asia/Kuala_Lumpur", "Malaysia (MYT)");
        TIMEZONE_TO_COUNTRY.put("Australia/Sydney", "Australia (AEST)");
        TIMEZONE_TO_COUNTRY.put("Australia/Melbourne", "Australia (AEST)");
        TIMEZONE_TO_COUNTRY.put("Australia/Brisbane", "Australia (AEST)");
        TIMEZONE_TO_COUNTRY.put("Australia/Perth", "Australia (AWST)");
        TIMEZONE_TO_COUNTRY.put("Australia/Adelaide", "Australia (ACST)");
        TIMEZONE_TO_COUNTRY.put("Pacific/Auckland", "New Zealand (NZST)");
        TIMEZONE_TO_COUNTRY.put("Pacific/Wellington", "New Zealand (NZST)");
        TIMEZONE_TO_COUNTRY.put("America/Sao_Paulo", "Brazil (BRT)");
        TIMEZONE_TO_COUNTRY.put("America/Argentina/Buenos_Aires", "Argentina (ART)");
        TIMEZONE_TO_COUNTRY.put("America/Mexico_City", "Mexico (CST)");
        TIMEZONE_TO_COUNTRY.put("America/Bogota", "Colombia (COT)");
        TIMEZONE_TO_COUNTRY.put("America/Lima", "Peru (PET)");
        TIMEZONE_TO_COUNTRY.put("America/Santiago", "Chile (CLT)");
        TIMEZONE_TO_COUNTRY.put("America/Dallas", "United States (CST)");
        TIMEZONE_TO_COUNTRY.put("Africa/Cairo", "Egypt (EET)");
        TIMEZONE_TO_COUNTRY.put("Africa/Lagos", "Nigeria (WAT)");
        TIMEZONE_TO_COUNTRY.put("Africa/Johannesburg", "South Africa (SAST)");
        TIMEZONE_TO_COUNTRY.put("Africa/Nairobi", "Kenya (EAT)");
        TIMEZONE_TO_COUNTRY.put("Asia/Karachi", "Pakistan (PKT)");
        TIMEZONE_TO_COUNTRY.put("Asia/Dhaka", "Bangladesh (BST)");
        TIMEZONE_TO_COUNTRY.put("Asia/Kathmandu", "Nepal (NPT)");
        TIMEZONE_TO_COUNTRY.put("Asia/Colombo", "Sri Lanka (IST)");
        TIMEZONE_TO_COUNTRY.put("Asia/Tashkent", "Uzbekistan (UZT)");
        TIMEZONE_TO_COUNTRY.put("Asia/Almaty", "Kazakhstan (ALMT)");
        TIMEZONE_TO_COUNTRY.put("Europe/Kiev", "Ukraine (EET)");
        TIMEZONE_TO_COUNTRY.put("Europe/Kyiv", "Ukraine (EET)");
        TIMEZONE_TO_COUNTRY.put("Europe/Minsk", "Belarus (MSK)");
        TIMEZONE_TO_COUNTRY.put("Asia/Baku", "Azerbaijan (AZT)");
        TIMEZONE_TO_COUNTRY.put("Asia/Tbilisi", "Georgia (GET)");
        TIMEZONE_TO_COUNTRY.put("Asia/Yerevan", "Armenia (AMT)");
        TIMEZONE_TO_COUNTRY.put("Asia/Beirut", "Lebanon (EET)");
        TIMEZONE_TO_COUNTRY.put("Asia/Jerusalem", "Israel (IST)");
        TIMEZONE_TO_COUNTRY.put("Asia/Qatar", "Qatar (AST)");
        TIMEZONE_TO_COUNTRY.put("Asia/Bahrain", "Bahrain (AST)");
        TIMEZONE_TO_COUNTRY.put("Asia/Kuwait", "Kuwait (AST)");
        TIMEZONE_TO_COUNTRY.put("Asia/Muscat", "Oman (GST)");
        TIMEZONE_TO_COUNTRY.put("Asia/Aden", "Yemen (AST)");
        TIMEZONE_TO_COUNTRY.put("Asia/Amman", "Jordan (EET)");
        TIMEZONE_TO_COUNTRY.put("Asia/Damascus", "Syria (EET)");
        TIMEZONE_TO_COUNTRY.put("Asia/Baghdad", "Iraq (AST)");
    }

    public static String getCountryFromTimezone(String timezoneId) {
        if (timezoneId == null || timezoneId.isEmpty()) {
            return "Unknown";
        }

        String country = TIMEZONE_TO_COUNTRY.get(timezoneId);
        if (country != null) {
            return country;
        }

        try {
            ZoneId zoneId = ZoneId.of(timezoneId);
            String region = zoneId.getId().split("/")[0];
            String city = zoneId.getId().split("/").length > 1 ? zoneId.getId().split("/")[1] : "";

            return region + " (" + city.replace("_", " ") + ")";
        } catch (Exception e) {
            return timezoneId;
        }
    }

    public static String getCurrentTimezone() {
        return ZoneId.systemDefault().getId();
    }

    public static String getCountry() {
        return getCountryFromTimezone(getCurrentTimezone());
    }
}
