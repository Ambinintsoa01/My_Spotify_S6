# MP3 Pipeline — Spring Boot + RabbitMQ

Pipeline asynchrone de traitement de fichiers `.mp3` composé de **4 programmes** orchestrés par **RabbitMQ**.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         mp3-pipeline (Spring Boot)                  │
│                                                                     │
│  ┌──────────────┐    Queue P1→P2        ┌─────────────────────┐    │
│  │  Programme 1 │  ──────────────────►  │    Programme 2      │    │
│  │   WATCHER    │  mp3.watcher.to.      │    EXTRACTOR        │    │
│  │              │    extractor          │                     │    │
│  │ Scan toutes  │                       │ Lit métadonnées ID3 │    │
│  │ X minutes    │                       │ (jaudiotagger)      │    │
│  └──────────────┘                       └──────────┬──────────┘    │
│         ▲                                          │               │
│         │ forgetFile()                Queue P2→P3  │               │
│         │                                          ▼               │
│  ┌──────────────┐                       ┌─────────────────────┐    │
│  │  Programme 4 │  ◄────────────────── │    Programme 3       │    │
│  │   CLEANER    │  deleteFile()         │    SENDER           │    │
│  │              │                       │                     │    │
│  │ Supprime le  │                       │ POST multipart/form │    │
│  │ fichier MP3  │                       │ vers API externe    │    │
│  └──────────────┘                       └─────────────────────┘    │
│                                                                     │
│  ══════════════════════════════════════════════════════════════     │
│  Log unique : ./logs/mp3-pipeline.log  (rolling daily, 30 jours)   │
└─────────────────────────────────────────────────────────────────────┘
```

### Flux de messages RabbitMQ

| Queue | Producteur | Consommateur | Contenu |
|---|---|---|---|
| `mp3.watcher.to.extractor` | Watcher (P1) | Extractor (P2) | `Mp3FileMessage` (chemin fichier) |
| `mp3.extractor.to.sender` | Extractor (P2) | Sender (P3) | `Mp3MetadataMessage` (fichier + métadonnées) |

---

## Prérequis

| Outil | Version |
|---|---|
| Java | 21 |
| Maven | 3.9+ |
| Docker + Compose | pour RabbitMQ |

---

## Démarrage rapide

### 1. Lancer RabbitMQ

```bash
docker compose up -d
```

Management UI disponible sur http://localhost:15672 (guest / guest).

### 2. Compiler le projet

```bash
mvn clean package -DskipTests
```

### 3. Lancer l'application

```bash
java -jar target/mp3-pipeline-1.0.0.jar
```

Avec surcharge de configuration :

```bash
java -jar target/mp3-pipeline-1.0.0.jar \
  --mp3.pipeline.inbox-directory=/chemin/vers/dossier \
  --mp3.pipeline.scan-interval-minutes=2 \
  --mp3.pipeline.api-url=http://mon-api.exemple.com/upload
```

### 4. Déposer un fichier .mp3

```bash
cp ma-chanson.mp3 ./mp3-inbox/
```

L'application détecte le fichier au prochain cycle de scan, extrait les métadonnées et l'envoie vers l'API.

---

## Configuration (application.yml)

| Propriété | Défaut | Description |
|---|---|---|
| `mp3.pipeline.inbox-directory` | `./mp3-inbox` | Répertoire surveillé |
| `mp3.pipeline.scan-interval-minutes` | `1` | Fréquence de scan (minutes) |
| `mp3.pipeline.api-url` | `http://localhost:8080/api/upload` | URL API destination |
| `mp3.pipeline.http-timeout-seconds` | `30` | Timeout connexion HTTP |
| `spring.rabbitmq.host` | `localhost` | Hôte RabbitMQ |
| `spring.rabbitmq.port` | `5672` | Port RabbitMQ |
| `spring.rabbitmq.username` | `guest` | Utilisateur RabbitMQ |
| `spring.rabbitmq.password` | `guest` | Mot de passe RabbitMQ |

Variables d'environnement équivalentes :
```bash
export MP3_INBOX_DIR=/data/mp3
export MP3_SCAN_INTERVAL=5
export MP3_API_URL=http://api.exemple.com/upload
export RABBITMQ_HOST=rabbit.exemple.com
```

---

## Format de l'appel API (Programme 3)

Requête `POST multipart/form-data` vers `mp3.pipeline.api-url` :

| Champ | Type | Description |
|---|---|---|
| `file` | binary | Fichier .mp3 |
| `fileName` | string | Nom du fichier |
| `tag_title` | string | Titre (ID3) |
| `tag_artist` | string | Artiste (ID3) |
| `tag_album` | string | Album (ID3) |
| `tag_year` | string | Année |
| `tag_genre` | string | Genre |
| `audio_bitrate` | string | Bitrate (kbps) |
| `audio_duration_secs` | string | Durée (secondes) |
| `file_size_bytes` | string | Taille (octets) |
| *(+ tous les autres champs extraits)* | | |

---

## Logs

Fichier unique : `./logs/mp3-pipeline.log`

Exemple de sortie :
```
2025-06-15 10:00:00.123 [main] INFO  c.m.watcher.Mp3WatcherService - [WATCHER] Démarré — surveillance de : /data/mp3 (intervalle : 1 min)
2025-06-15 10:01:00.001 [task-1] INFO  c.m.watcher.Mp3WatcherService - [WATCHER] [2025-06-15 10:01:00] Début du scan du répertoire : /data/mp3
2025-06-15 10:01:00.045 [task-1] INFO  c.m.watcher.Mp3WatcherService - [WATCHER] [2025-06-15 10:01:00] 1 fichier(s) .mp3 détecté(s).
2025-06-15 10:01:00.067 [task-1] INFO  c.m.watcher.Mp3WatcherService - [WATCHER] [2025-06-15 10:01:00] Fichier publié dans la queue → [chanson.mp3]
2025-06-15 10:01:00.089 [rabbit-1] INFO  c.m.extractor.Mp3ExtractorService - [EXTRACTOR] [2025-06-15 10:01:00] Message reçu — début extraction : chanson.mp3
2025-06-15 10:01:00.234 [rabbit-1] INFO  c.m.extractor.Mp3ExtractorService - [EXTRACTOR] [2025-06-15 10:01:00] Extraction terminée pour : chanson.mp3 — 18 champ(s) extraits.
2025-06-15 10:01:00.251 [rabbit-2] INFO  c.m.sender.Mp3SenderService - [SENDER] [2025-06-15 10:01:00] Message reçu — envoi en cours : chanson.mp3
2025-06-15 10:01:01.100 [rabbit-2] INFO  c.m.sender.Mp3SenderService - [SENDER] [2025-06-15 10:01:01] Envoi réussi : chanson.mp3
2025-06-15 10:01:01.120 [rabbit-2] INFO  c.m.cleaner.Mp3CleanerService - [CLEANER] [2025-06-15 10:01:01] Fichier supprimé avec succès : chanson.mp3
```

---

## Structure du projet

```
mp3-pipeline/
├── docker-compose.yml
├── pom.xml
├── mp3-inbox/                          ← répertoire surveillé (créé auto)
├── logs/                               ← logs applicatifs (créé auto)
└── src/main/
    ├── java/com/mp3pipeline/
    │   ├── Mp3PipelineApplication.java
    │   ├── config/
    │   │   ├── RabbitMQConfig.java     ← queues, exchanges, bindings
    │   │   ├── PipelineProperties.java ← propriétés @ConfigurationProperties
    │   │   └── HttpClientConfig.java   ← RestTemplate avec timeout
    │   ├── messaging/
    │   │   ├── Mp3FileMessage.java     ← DTO P1→P2
    │   │   └── Mp3MetadataMessage.java ← DTO P2→P3
    │   ├── watcher/
    │   │   └── Mp3WatcherService.java  ← Programme 1
    │   ├── extractor/
    │   │   └── Mp3ExtractorService.java ← Programme 2
    │   ├── sender/
    │   │   └── Mp3SenderService.java   ← Programme 3
    │   └── cleaner/
    │       └── Mp3CleanerService.java  ← Programme 4
    └── resources/
        ├── application.yml
        └── logback-spring.xml
```
