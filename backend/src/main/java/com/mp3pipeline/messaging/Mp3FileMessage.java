package com.mp3pipeline.messaging;

import java.io.Serializable;

/**
 * Message envoyé par le Programme 1 (Watcher) vers le Programme 2 (Extractor).
 * Contient uniquement le chemin absolu du fichier .mp3 détecté.
 */
public class Mp3FileMessage implements Serializable {

    private String filePath;
    private String fileName;
    private long   detectedAt;   // timestamp epoch ms

    public Mp3FileMessage() {}

    public Mp3FileMessage(String filePath, String fileName, long detectedAt) {
        this.filePath   = filePath;
        this.fileName   = fileName;
        this.detectedAt = detectedAt;
    }

    public String getFilePath()   { return filePath; }
    public void setFilePath(String filePath) { this.filePath = filePath; }

    public String getFileName()   { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public long getDetectedAt()   { return detectedAt; }
    public void setDetectedAt(long detectedAt) { this.detectedAt = detectedAt; }

    @Override
    public String toString() {
        return "Mp3FileMessage{fileName='" + fileName + "', filePath='" + filePath + "'}";
    }
}
