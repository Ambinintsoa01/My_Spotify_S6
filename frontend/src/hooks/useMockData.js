// Mock data for development — replace with real API calls in production

export const MOCK_MP3S = [
  { id:1, fileName:"Midnight City.mp3",   tagTitle:"Midnight City",   tagArtist:"M83",          tagAlbum:"Hurry Up, We're Dreaming", tagGenre:"Electronic", tagYear:"2011", audioDurationSecs:243, audioBitrate:320, fileSizeBytes:9720000 },
  { id:2, fileName:"Bohemian Rhapsody.mp3",tagTitle:"Bohemian Rhapsody",tagArtist:"Queen",       tagAlbum:"A Night at the Opera",     tagGenre:"Rock",       tagYear:"1975", audioDurationSecs:354, audioBitrate:256, fileSizeBytes:11328000 },
  { id:3, fileName:"Blinding Lights.mp3", tagTitle:"Blinding Lights", tagArtist:"The Weeknd",   tagAlbum:"After Hours",              tagGenre:"Synth-pop",  tagYear:"2020", audioDurationSecs:200, audioBitrate:320, fileSizeBytes:8000000 },
  { id:4, fileName:"Billie Jean.mp3",     tagTitle:"Billie Jean",     tagArtist:"Michael Jackson",tagAlbum:"Thriller",               tagGenre:"Pop",        tagYear:"1982", audioDurationSecs:294, audioBitrate:256, fileSizeBytes:9408000 },
  { id:5, fileName:"Hotel California.mp3",tagTitle:"Hotel California",tagArtist:"Eagles",        tagAlbum:"Hotel California",         tagGenre:"Rock",       tagYear:"1977", audioDurationSecs:391, audioBitrate:320, fileSizeBytes:15640000 },
  { id:6, fileName:"Starboy.mp3",         tagTitle:"Starboy",         tagArtist:"The Weeknd",   tagAlbum:"Starboy",                  tagGenre:"R&B",        tagYear:"2016", audioDurationSecs:230, audioBitrate:320, fileSizeBytes:9200000 },
  { id:7, fileName:"One More Time.mp3",   tagTitle:"One More Time",   tagArtist:"Daft Punk",    tagAlbum:"Discovery",                tagGenre:"Electronic", tagYear:"2001", audioDurationSecs:320, audioBitrate:256, fileSizeBytes:10240000 },
  { id:8, fileName:"Shape of You.mp3",    tagTitle:"Shape of You",    tagArtist:"Ed Sheeran",   tagAlbum:"÷",                        tagGenre:"Pop",        tagYear:"2017", audioDurationSecs:234, audioBitrate:320, fileSizeBytes:9360000 },
  { id:9, fileName:"Smells Like Teen.mp3",tagTitle:"Smells Like Teen Spirit",tagArtist:"Nirvana",tagAlbum:"Nevermind",              tagGenre:"Grunge",     tagYear:"1991", audioDurationSecs:301, audioBitrate:256, fileSizeBytes:9632000 },
  { id:10,fileName:"Thriller.mp3",        tagTitle:"Thriller",        tagArtist:"Michael Jackson",tagAlbum:"Thriller",              tagGenre:"Pop",        tagYear:"1982", audioDurationSecs:358, audioBitrate:256, fileSizeBytes:11456000 },
  { id:11,fileName:"Get Lucky.mp3",       tagTitle:"Get Lucky",       tagArtist:"Daft Punk",    tagAlbum:"Random Access Memories",   tagGenre:"Electronic", tagYear:"2013", audioDurationSecs:369, audioBitrate:320, fileSizeBytes:14760000 },
  { id:12,fileName:"Rolling In Deep.mp3", tagTitle:"Rolling in the Deep",tagArtist:"Adele",     tagAlbum:"21",                       tagGenre:"Soul",       tagYear:"2010", audioDurationSecs:228, audioBitrate:320, fileSizeBytes:9120000 },
];

export const MOCK_PLAYLISTS = [
  { id:1, name:"Electronic Voyage", totalDurationSecs: 932, trackCount:4, tracks:[MOCK_MP3S[0],MOCK_MP3S[6],MOCK_MP3S[10],MOCK_MP3S[2]], createdAt:"2025-06-10T10:00:00" },
  { id:2, name:"Rock Classics", totalDurationSecs: 1046, trackCount:3, tracks:[MOCK_MP3S[1],MOCK_MP3S[4],MOCK_MP3S[8]], createdAt:"2025-06-12T15:30:00" },
  { id:3, name:"Pop Hits",      totalDurationSecs: 1114, trackCount:4, tracks:[MOCK_MP3S[2],MOCK_MP3S[3],MOCK_MP3S[7],MOCK_MP3S[9]], createdAt:"2025-06-15T09:00:00" },
];

export function formatDuration(secs) {
  if (!secs) return "0:00";
  const m = Math.floor(secs / 60);
  const s = String(Math.floor(secs % 60)).padStart(2, "0");
  return `${m}:${s}`;
}

export function formatSize(bytes) {
  if (!bytes) return "—";
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
