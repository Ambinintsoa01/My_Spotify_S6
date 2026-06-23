package com.mp3pipeline.messaging;

import java.io.Serializable;
import java.util.Map;

/**
 * Message envoyé par le Programme 2 (Extractor) vers le Programme 3 (Sender).
 * Contient le chemin du fichier .mp3 ainsi que toutes ses métadonnées extraites.
 */
public class Mp3MetadataMessage implements Serializable {

    private String              filePath;
    private String              fileName;
    private Map<String, String> metadata;
    private long                extractedAt;  // timestamp epoch ms

    public Mp3MetadataMessage() {}

    public Mp3MetadataMessage(String filePath, String fileName,
                               Map<String, String> metadata, long extractedAt) {
        this.filePath    = filePath;
        this.fileName    = fileName;
        this.metadata    = metadata;
        this.extractedAt = extractedAt;
    }

    public String getFilePath()              { return filePath; }
    public void setFilePath(String filePath) { this.filePath = filePath; }

    public String getFileName()              { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public Map<String, String> getMetadata()                     { return metadata; }
    public void setMetadata(Map<String, String> metadata)        { this.metadata = metadata; }

    public long getExtractedAt()             { return extractedAt; }
    public void setExtractedAt(long extractedAt) { this.extractedAt = extractedAt; }

    @Override
    public String toString() {
        return "Mp3MetadataMessage{fileName='" + fileName + "', metadata=" + metadata + "}";
    }
}
