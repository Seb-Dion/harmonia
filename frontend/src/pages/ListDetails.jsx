import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, X, GripVertical } from "lucide-react";
import api from "../api/api";
import "../styles/ListDetails.css";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

function ListDetails() {
  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(true);
  const { listId } = useParams();
  const [error, setError] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    const fetchListDetails = async () => {
      console.log("Fetching list details for ID:", listId);
      try {
        const response = await api.get(`/api/lists/${listId}/`);
        console.log("List details response:", response.data);
        setList(response.data);
        setLoading(false);
      } catch (error) {
        console.error(
          "Error fetching list details:",
          error.response?.data || error
        );
        setError(error.response?.data?.error || "Failed to fetch list details");
        setLoading(false);
      }
    };

    fetchListDetails();
  }, [listId]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearchLoading(true);
    try {
      const response = await api.get(
        `api/spotify/search/?q=${encodeURIComponent(searchQuery)}&limit=20`
      );
      if (response.data.tracks?.items) {
        const formattedResults = response.data.tracks.items.map((track) => ({
          spotify_id: track.album.id,
          name: track.album.name,
          artist: track.artists[0].name,
          image_url: track.album.images[0]?.url || "",
          release_date: track.album.release_date || "",
          external_url: track.album.external_urls?.spotify || "",
        }));

        const uniqueAlbums = Array.from(
          new Map(
            formattedResults.map((album) => [album.spotify_id, album])
          ).values()
        );

        setSearchResults(uniqueAlbums);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAddAlbum = async (album) => {
    try {
      let formattedDate = album.release_date;
      if (formattedDate) {
        if (formattedDate.length === 4) {
          formattedDate = `${formattedDate}-01-01`;
        } else if (formattedDate.length === 7) {
          formattedDate = `${formattedDate}-01`;
        }
      } else {
        formattedDate = "2000-01-01";
      }

      const albumData = {
        spotify_id: album.spotify_id,
        name: album.name,
        artist: album.artists?.[0]?.name || album.artist,
        image_url: album.images?.[0]?.url || album.image_url,
        release_date: formattedDate,
        external_url:
          album.external_urls?.spotify ||
          album.external_url ||
          `https://open.spotify.com/album/${album.spotify_id}`,
      };

      console.log("Adding album to list:", albumData);

      await api.post(`/api/lists/${listId}/add_album/`, albumData);

      const updatedList = await api.get(`/api/lists/${listId}/`);
      setList(updatedList.data);

      setShowSearch(false);
      setSearchQuery("");
      setSearchResults([]);
      setError(null);
    } catch (error) {
      console.error("Error adding album:", error);
      console.error("Error details:", error.response?.data);
      setError(error.response?.data?.error || "Failed to add album to list");
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const items = Array.from(list.albums);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update local state immediately for smooth UI
    setList({
      ...list,
      albums: items.map((item, index) => ({
        ...item,
        rank: index + 1,
      })),
    });

    // Update backend
    try {
      await api.put(
        `/api/lists/${listId}/update_ranks/`,
        items.map((item, index) => ({
          id: item.id,
          rank: index + 1,
        }))
      );
    } catch (error) {
      console.error("Error updating ranks:", error);
      // Optionally revert the state if the backend update fails
    }
  };

  if (loading)
    return <div className="loading">Loading... (List ID: {listId})</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!list) return <div className="error">No list data found</div>;

  return (
    <div className="list-details-container">
      <div className="list-header">
        <h2 className="list-title">{list.title}</h2>
        <div className="header-buttons">
          <motion.button
            className={`edit-rankings-button ${isEditMode ? "active" : ""}`}
            onClick={() => setIsEditMode(!isEditMode)}
            whileHover={{
              scale: 1.05,
              backgroundColor: isEditMode
                ? "rgb(137, 58, 201)"
                : "var(--color-bg-highlight)",
            }}
            whileTap={{ scale: 0.95 }}
            transition={{
              duration: 0.2,
              ease: "easeOut",
            }}
          >
            {isEditMode ? "Save Rankings" : "Edit Rankings"}
          </motion.button>
          <motion.button
            className="add-album-button"
            onClick={() => setShowSearch(true)}
            whileHover={{
              scale: 1.05,
              backgroundColor: "rgb(157, 78, 221)",
            }}
            whileTap={{ scale: 0.95 }}
            transition={{
              duration: 0.2,
              ease: "easeOut",
            }}
          >
            <motion.div
              initial={{ rotate: 0 }}
              whileHover={{ rotate: 90 }}
              transition={{ duration: 0.2 }}
            >
              <Plus size={20} />
            </motion.div>
            Add Album
          </motion.button>
        </div>
      </div>
      <p>{list.description}</p>
      {list && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="albums">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={`album-grid ${isEditMode ? "edit-mode" : ""}`}
              >
                {list.albums?.map((album, index) => (
                  <Draggable
                    key={album.id.toString()}
                    draggableId={album.id.toString()}
                    index={index}
                    isDragDisabled={!isEditMode}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`album-card ${
                          isEditMode ? "edit-mode" : ""
                        } ${snapshot.isDragging ? "dragging" : ""}`}
                      >
                        <div className="rank-badge">{index + 1}</div>
                        {isEditMode && (
                          <div
                            className="drag-handle"
                            {...provided.dragHandleProps}
                          >
                            <GripVertical size={20} />
                          </div>
                        )}
                        <img
                          src={album.image_url || "/default-album.png"}
                          alt={album.name}
                          onError={(e) => {
                            e.target.src = "/default-album.png";
                          }}
                        />
                        <div className="album-info">
                          <h3>{album.name}</h3>
                          <p>{album.artist}</p>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      <AnimatePresence>
        {showSearch && (
          <motion.div
            className="search-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="modal-content"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
            >
              <div className="modal-header">
                <h3>Add Album to List</h3>
                <button
                  className="close-button"
                  onClick={() => setShowSearch(false)}
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSearch} className="search-form">
                <div className="search-input-container">
                  <input
                    type="search"
                    placeholder="Search for albums..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button type="submit">
                    {searchLoading ? "Searching..." : <Search size={20} />}
                  </button>
                </div>
              </form>

              <div className="search-results">
                {searchResults.map((album) => (
                  <div key={album.spotify_id} className="result-item">
                    <img
                      src={album.image_url}
                      alt={`${album.name} by ${album.artist}`}
                    />
                    <div className="result-info">
                      <h4>{album.name}</h4>
                      <p>{album.artist}</p>
                    </div>
                    <button
                      onClick={() => handleAddAlbum(album)}
                      className="add-button"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ListDetails;
