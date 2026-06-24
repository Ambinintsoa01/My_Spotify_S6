package com.mp3pipeline.repository;

import com.mp3pipeline.entity.PlaylistTrack;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PlaylistTrackRepository extends JpaRepository<PlaylistTrack, Long> {
    void deleteByPlaylistId(Long playlistId);
}