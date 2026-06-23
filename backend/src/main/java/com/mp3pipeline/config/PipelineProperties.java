package com.mp3pipeline.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Propriétés de configuration du pipeline MP3,
 * lues depuis application.yml (préfixe : mp3.pipeline).
 */
@Configuration
@ConfigurationProperties(prefix = "mp3.pipeline")
public class PipelineProperties {

    /** Chemin du répertoire surveillé */
    private String inboxDirectory = "./mp3-inbox";

    /** Intervalle de scan en minutes */
    private int scanIntervalMinutes = 1;

    /** URL de l'API destinataire */
    private String apiUrl = "http://localhost:8080/api/upload";

    /** Timeout HTTP en secondes */
    private int httpTimeoutSeconds = 30;

    // ── Getters / Setters ─────────────────────────────────────────────────────
    public String getInboxDirectory() { return inboxDirectory; }
    public void setInboxDirectory(String inboxDirectory) { this.inboxDirectory = inboxDirectory; }

    public int getScanIntervalMinutes() { return scanIntervalMinutes; }
    public void setScanIntervalMinutes(int scanIntervalMinutes) { this.scanIntervalMinutes = scanIntervalMinutes; }

    public String getApiUrl() { return apiUrl; }
    public void setApiUrl(String apiUrl) { this.apiUrl = apiUrl; }

    public int getHttpTimeoutSeconds() { return httpTimeoutSeconds; }
    public void setHttpTimeoutSeconds(int httpTimeoutSeconds) { this.httpTimeoutSeconds = httpTimeoutSeconds; }
}
