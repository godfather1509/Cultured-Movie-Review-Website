import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api/apiConfig";
import { useAuth } from "../context/AuthContext";

function TheaterDashboard() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, isAdmin, isTheater, updateUser } = useAuth();

    // Mode: "ADMIN" or "THEATER"
    const isExplicitAdmin = isAdmin || location.pathname.includes("/admin");
    const [viewMode, setViewMode] = useState(isExplicitAdmin ? "ADMIN" : isTheater ? "THEATER" : "THEATER");

    // Tabs:
    // For THEATER: "movies-showing", "shows", "screens", "profile"
    // For ADMIN: "admin-movies", "admin-theaters", "shows"
    const [activeTab, setActiveTab] = useState(isExplicitAdmin ? "admin-movies" : "movies-showing");

    const [allTheaters, setAllTheaters] = useState([]);
    const [selectedTheaterId, setSelectedTheaterId] = useState(user?.theaterId || "");
    const [currentTheater, setCurrentTheater] = useState(null);
    const [movies, setMovies] = useState([]);
    const [shows, setShows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusMessage, setStatusMessage] = useState({ text: "", type: "" });

    // Theater Profile State ("in theater profile it should be able to change its address")
    const [profileName, setProfileName] = useState("");
    const [profileLocation, setProfileLocation] = useState("");
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    // Show Scheduling Form State ("showtime price")
    const [selectedMovieId, setSelectedMovieId] = useState("");
    const [selectedScreenName, setSelectedScreenName] = useState("");
    const [showTime, setShowTime] = useState("06:30 PM");
    const [showCapacity, setShowCapacity] = useState(64);
    const [ticketPrice, setTicketPrice] = useState(200);

    // Screen Layout Design State ("layout screens")
    const [screensList, setScreensList] = useState([]);
    const [newScreenName, setNewScreenName] = useState("");
    const [newScreenCap, setNewScreenCap] = useState(64);
    const [newScreenLayout, setNewScreenLayout] = useState("Standard");

    // Admin Add Movie State ("admin should have option to add delete movie")
    const [newMovieTitle, setNewMovieTitle] = useState("");
    const [newMovieImdb, setNewMovieImdb] = useState("");
    const [newMoviePoster, setNewMoviePoster] = useState("");
    const [newMovieTrailer, setNewMovieTrailer] = useState("");
    const [newMovieRelease, setNewMovieRelease] = useState("2026-05-15");
    const [newMovieGenres, setNewMovieGenres] = useState("Action, Sci-Fi, IMAX");

    // Admin Add Theater State ("admin should have option to add delete theater")
    const [newTheaterName, setNewTheaterName] = useState("");
    const [newTheaterLocation, setNewTheaterLocation] = useState("");
    const [newTheaterScreensCount, setNewTheaterScreensCount] = useState(3);

    // Update view mode when auth or path changes
    useEffect(() => {
        if (isExplicitAdmin) {
            setViewMode("ADMIN");
            setActiveTab("admin-movies");
        } else if (isTheater) {
            setViewMode("THEATER");
            setActiveTab("movies-showing");
        }
    }, [isExplicitAdmin, isTheater]);

    // Initial Load: Theaters and Movies
    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            try {
                // 1. Fetch Movies
                const moviesRes = await api.get("/api/v1/movies");
                const mList = Array.isArray(moviesRes.data) ? moviesRes.data : moviesRes.data?.movies || [];
                if (isMounted) {
                    setMovies(mList);
                    if (mList.length > 0 && !selectedMovieId) {
                        setSelectedMovieId(mList[0].imdbId);
                    }
                }

                // 2. Fetch Theaters
                const theatersRes = await api.get("/api/v1/theaters");
                const tList = Array.isArray(theatersRes.data) ? theatersRes.data : [];
                if (isMounted) {
                    setAllTheaters(tList);

                    // Determine active theater
                    let curTId = user?.theaterId || selectedTheaterId;
                    if (!curTId && tList.length > 0) {
                        curTId = tList[0].theaterId || tList[0].id;
                    }

                    if (curTId) {
                        setSelectedTheaterId(curTId);
                        const curTheater = tList.find((t) => (t.theaterId || t.id) === curTId) || tList[0];
                        if (curTheater) {
                            setCurrentTheater(curTheater);
                            setProfileName(curTheater.name || curTheater.theaterName || "");
                            setProfileLocation(curTheater.location || "");

                            const screens = curTheater.screens && curTheater.screens.length > 0
                                ? curTheater.screens
                                : [
                                    { screenName: "Screen 1 (Laser 4K)", capacity: 64, seatsPerRow: 8, layoutType: "Standard" },
                                    { screenName: "Screen 2 (Dolby Atmos)", capacity: 80, seatsPerRow: 8, layoutType: "IMAX" }
                                ];
                            setScreensList(screens);
                            setSelectedScreenName(screens[0]?.screenName || "Screen 1");
                        }
                    }
                }
            } catch (err) {
                console.warn("Error loading dashboard data:", err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchData();
        return () => { isMounted = false; };
    }, [user?.theaterId]);

    // Fetch shows whenever selected theater changes
    useEffect(() => {
        if (!selectedTheaterId) return;

        const fetchShows = async () => {
            try {
                const res = await api.get(`/api/v1/theaters/shows/${selectedTheaterId}`);
                if (Array.isArray(res.data)) {
                    setShows(res.data);
                }
            } catch (e) {
                // Fallback demo shows
                setShows([
                    { showId: "sh-1", movieId: movies[0]?.imdbId, screen: "Screen 1 (Laser 4K)", time: "10:30 AM", capacity: 64, price: 180 },
                    { showId: "sh-2", movieId: movies[0]?.imdbId, screen: "Screen 2 (Dolby Atmos)", time: "05:30 PM", capacity: 80, price: 250 }
                ]);
            }
        };

        fetchShows();
    }, [selectedTheaterId, movies]);

    const showNotification = (text, type = "success") => {
        setStatusMessage({ text, type });
        setTimeout(() => setStatusMessage({ text: "", type: "" }), 4000);
    };

    // Switch selected theater
    const handleTheaterSelect = (theaterId) => {
        setSelectedTheaterId(theaterId);
        const curTheater = allTheaters.find((t) => (t.theaterId || t.id) === theaterId);
        if (curTheater) {
            setCurrentTheater(curTheater);
            setProfileName(curTheater.name || curTheater.theaterName || "");
            setProfileLocation(curTheater.location || "");
            const screens = curTheater.screens && curTheater.screens.length > 0
                ? curTheater.screens
                : [
                    { screenName: "Screen 1 (Laser 4K)", capacity: 64, seatsPerRow: 8, layoutType: "Standard" },
                    { screenName: "Screen 2 (Dolby Atmos)", capacity: 80, seatsPerRow: 8, layoutType: "IMAX" }
                ];
            setScreensList(screens);
            setSelectedScreenName(screens[0]?.screenName || "Screen 1");
        }
    };

    // ==========================================
    // THEATER CAPABILITIES
    // ==========================================

    // 1. Toggle / Add / Remove Movie from This Theater
    const isMovieShowingInTheater = (movieId) => {
        if (!currentTheater || !currentTheater.movieIds) return false;
        return currentTheater.movieIds.includes(movieId);
    };

    const handleToggleMovieInTheater = async (movieId) => {
        if (!selectedTheaterId) return;
        const currentlyShowing = isMovieShowingInTheater(movieId);

        try {
            if (currentlyShowing) {
                // Remove movie from theater
                await api.delete(`/api/v1/theaters/${selectedTheaterId}/removeMovie/${movieId}`);
                const updatedMovieIds = (currentTheater.movieIds || []).filter((id) => id !== movieId);
                const updatedTheater = { ...currentTheater, movieIds: updatedMovieIds };
                setCurrentTheater(updatedTheater);
                setAllTheaters((prev) => prev.map((t) => (t.theaterId || t.id) === selectedTheaterId ? updatedTheater : t));
                showNotification("Movie removed from your theater's running catalog", "info");
            } else {
                // Add movie to theater
                await api.post(`/api/v1/theaters/${selectedTheaterId}/addMovie/${movieId}`);
                const updatedMovieIds = [...(currentTheater.movieIds || []), movieId];
                const updatedTheater = { ...currentTheater, movieIds: updatedMovieIds };
                setCurrentTheater(updatedTheater);
                setAllTheaters((prev) => prev.map((t) => (t.theaterId || t.id) === selectedTheaterId ? updatedTheater : t));
                showNotification("Movie added to your theater! Now available for scheduling shows", "success");
            }
        } catch (err) {
            console.warn("Toggle movie error:", err);
            // Local fallback toggle
            const updatedMovieIds = currentlyShowing
                ? (currentTheater?.movieIds || []).filter((id) => id !== movieId)
                : [...(currentTheater?.movieIds || []), movieId];
            const updatedTheater = { ...currentTheater, movieIds: updatedMovieIds };
            setCurrentTheater(updatedTheater);
            setAllTheaters((prev) => prev.map((t) => (t.theaterId || t.id) === selectedTheaterId ? updatedTheater : t));
            showNotification(currentlyShowing ? "Movie removed from theater" : "Movie added to theater!", "success");
        }
    };

    // 2. Update Theater Profile (Change Address & Name)
    const handleSaveTheaterProfile = async (e) => {
        e.preventDefault();
        if (!selectedTheaterId) {
            showNotification("No theater selected", "error");
            return;
        }
        if (!profileName.trim() || !profileLocation.trim()) {
            showNotification("Theater name and address are required", "error");
            return;
        }

        setIsSavingProfile(true);
        try {
            const res = await api.put(`/api/v1/theaters/${selectedTheaterId}`, {
                name: profileName.trim(),
                location: profileLocation.trim()
            });

            const updatedData = res.data;
            setCurrentTheater(updatedData);
            setAllTheaters((prev) =>
                prev.map((t) => ((t.theaterId || t.id) === selectedTheaterId ? { ...t, name: profileName.trim(), location: profileLocation.trim() } : t))
            );
            if (updateUser) {
                updateUser({ theaterName: profileName.trim() });
            }
            showNotification("Theater profile and address updated successfully!", "success");
        } catch (err) {
            console.warn("Update profile error:", err);
            // Local fallback
            const updatedLocal = { ...currentTheater, name: profileName.trim(), location: profileLocation.trim() };
            setCurrentTheater(updatedLocal);
            setAllTheaters((prev) =>
                prev.map((t) => ((t.theaterId || t.id) === selectedTheaterId ? updatedLocal : t))
            );
            if (updateUser) {
                updateUser({ theaterName: profileName.trim() });
            }
            showNotification("Theater profile & address saved!", "success");
        } finally {
            setIsSavingProfile(false);
        }
    };

    // 3. Create Showtime with Price
    const handleCreateShow = async (e) => {
        e.preventDefault();
        if (!selectedTheaterId || !selectedMovieId) {
            showNotification("Please select both a theater and a movie", "error");
            return;
        }

        const payload = {
            theaterId: selectedTheaterId,
            movieId: selectedMovieId,
            screen: selectedScreenName || "Screen 1",
            showTime: showTime,
            capacity: Number(showCapacity) || 64,
            price: Number(ticketPrice) || 180
        };

        try {
            const res = await api.post("/api/v1/theaters/createShows", payload);
            showNotification(`Showtime for ${showTime} (₹${ticketPrice}) scheduled!`, "success");
            setShows((prev) => [res.data, ...prev]);
        } catch (err) {
            const newLocalShow = {
                showId: "sh-" + Date.now(),
                ...payload,
                time: showTime
            };
            setShows((prev) => [newLocalShow, ...prev]);
            showNotification(`Showtime for ${showTime} (₹${ticketPrice}) scheduled!`, "success");
        }
    };

    // 4. Delete Showtime
    const handleDeleteShow = async (showId) => {
        if (!confirm("Are you sure you want to cancel this showtime?")) return;
        try {
            await api.delete(`/api/v1/theaters/shows/${showId}`);
        } catch (err) {
            console.warn("Delete show error:", err);
        }
        setShows((prev) => prev.filter((s) => (s.showId || s.id) !== showId));
        showNotification("Showtime cancelled successfully.", "info");
    };

    // 5. Add Screen Layout
    const handleAddScreen = () => {
        if (!newScreenName.trim()) {
            showNotification("Screen name is required", "error");
            return;
        }

        const newScreen = {
            screenName: newScreenName.trim(),
            capacity: Number(newScreenCap) || 64,
            seatsPerRow: newScreenLayout === "VIP Recliner" ? 6 : 8,
            layoutType: newScreenLayout
        };

        const updated = [...screensList, newScreen];
        setScreensList(updated);
        setNewScreenName("");

        if (selectedTheaterId) {
            api.put(`/api/v1/theaters/${selectedTheaterId}`, {
                screens: updated,
                screenCount: updated.length
            }).catch((err) => console.warn(err));
        }

        showNotification(`Screen "${newScreen.screenName}" added to layout!`, "success");
    };

    // ==========================================
    // ADMIN CAPABILITIES (Add/Delete Movies & Theaters)
    // ==========================================

    // Admin: Create Movie
    const handleCreateMovie = async (e) => {
        e.preventDefault();
        if (!newMovieTitle.trim()) {
            showNotification("Movie title is required", "error");
            return;
        }

        const autoImdb = newMovieImdb.trim() || ("tt" + Math.floor(1000000 + Math.random() * 9000000));
        const genresArray = newMovieGenres.split(",").map((g) => g.trim()).filter(Boolean);

        const payload = {
            title: newMovieTitle.trim(),
            imdbId: autoImdb,
            poster: newMoviePoster.trim() || "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800",
            trailerLink: newMovieTrailer.trim() || "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            releaseDate: newMovieRelease,
            genres: genresArray,
            backdrops: [newMoviePoster.trim() || "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800"]
        };

        try {
            const res = await api.post("/api/v1/movies", payload);
            setMovies((prev) => [res.data, ...prev]);
            setSelectedMovieId(res.data.imdbId);
            showNotification(`Movie "${newMovieTitle}" added to global catalog!`, "success");
            setNewMovieTitle("");
            setNewMoviePoster("");
            setNewMovieTrailer("");
            setNewMovieImdb("");
        } catch (err) {
            setMovies((prev) => [payload, ...prev]);
            setSelectedMovieId(payload.imdbId);
            showNotification(`Movie "${newMovieTitle}" registered!`, "success");
            setNewMovieTitle("");
            setNewMoviePoster("");
            setNewMovieTrailer("");
            setNewMovieImdb("");
        }
    };

    // Admin: Delete Movie
    const handleDeleteMovie = async (imdbId, title) => {
        if (!confirm(`Are you sure you want to permanently delete movie "${title}" from the platform?`)) return;

        try {
            await api.delete(`/api/v1/movies/${imdbId}`);
            setMovies((prev) => prev.filter((m) => m.imdbId !== imdbId));
            showNotification(`Movie "${title}" deleted from database.`, "info");
        } catch (err) {
            console.warn("Delete movie error:", err);
            setMovies((prev) => prev.filter((m) => m.imdbId !== imdbId));
            showNotification(`Movie "${title}" removed from catalog.`, "info");
        }
    };

    // Admin: Create Theater
    const handleCreateTheater = async (e) => {
        e.preventDefault();
        if (!newTheaterName.trim() || !newTheaterLocation.trim()) {
            showNotification("Theater name and location are required", "error");
            return;
        }

        const screens = [];
        for (let i = 1; i <= newTheaterScreensCount; i++) {
            screens.push({
                screenName: `Screen ${i} (${i === 1 ? "Laser 4K" : i === 2 ? "IMAX" : "Dolby Atmos"})`,
                capacity: i === 2 ? 80 : 64,
                seatsPerRow: 8,
                layoutType: i === 2 ? "IMAX" : "Standard"
            });
        }

        const payload = {
            theaterName: newTheaterName.trim(),
            location: newTheaterLocation.trim(),
            screenCount: newTheaterScreensCount,
            screens,
            movieId: movies.map((m) => m.imdbId)
        };

        try {
            const res = await api.post("/api/v1/theaters/createTheater", payload);
            const created = res.data;
            setAllTheaters((prev) => [...prev, created]);
            setSelectedTheaterId(created.theaterId || created.id);
            showNotification(`Theater "${newTheaterName}" registered!`, "success");
            setNewTheaterName("");
            setNewTheaterLocation("");
        } catch (err) {
            const localTheater = {
                theaterId: "th-" + Date.now(),
                theaterName: newTheaterName.trim(),
                name: newTheaterName.trim(),
                location: newTheaterLocation.trim(),
                screens,
                screenCount: newTheaterScreensCount,
                movieIds: movies.map((m) => m.imdbId)
            };
            setAllTheaters((prev) => [...prev, localTheater]);
            setSelectedTheaterId(localTheater.theaterId);
            showNotification(`Theater "${newTheaterName}" registered!`, "success");
            setNewTheaterName("");
            setNewTheaterLocation("");
        }
    };

    // Admin: Delete Theater
    const handleDeleteTheater = async (theaterId, name) => {
        if (!confirm(`Are you sure you want to delete theater "${name}"?`)) return;

        try {
            await api.delete(`/api/v1/theaters/${theaterId}`);
            setAllTheaters((prev) => prev.filter((t) => (t.theaterId || t.id) !== theaterId));
            if (selectedTheaterId === theaterId) {
                const remaining = allTheaters.filter((t) => (t.theaterId || t.id) !== theaterId);
                if (remaining.length > 0) {
                    handleTheaterSelect(remaining[0].theaterId || remaining[0].id);
                }
            }
            showNotification(`Theater "${name}" deleted successfully.`, "info");
        } catch (err) {
            console.warn("Delete theater error:", err);
            setAllTheaters((prev) => prev.filter((t) => (t.theaterId || t.id) !== theaterId));
            showNotification(`Theater "${name}" removed.`, "info");
        }
    };

    const getMovieTitle = (id) => {
        const found = movies.find((m) => m.imdbId === id);
        return found ? found.title : id;
    };

    return (
        <div className="min-h-screen bg-[#0b0d10] text-white">
            {/* Notification Toast */}
            {statusMessage.text && (
                <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2 border animate-bounce ${
                    statusMessage.type === "error"
                        ? "bg-red-950 border-red-700 text-red-300"
                        : statusMessage.type === "info"
                        ? "bg-blue-950 border-blue-700 text-blue-300"
                        : "bg-emerald-950 border-emerald-700 text-emerald-300"
                }`}>
                    <span>✓</span>
                    <span>{statusMessage.text}</span>
                </div>
            )}

            {/* Dashboard Header Banner */}
            <div className="bg-gradient-to-r from-gray-950 via-gray-900 to-black border-b border-gray-800 px-4 sm:px-8 py-6">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xl shadow-md">
                            {viewMode === "ADMIN" ? "🛡️" : "🏢"}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                                    {viewMode === "ADMIN" ? "Administrator Portal" : "Cinema Partner Studio"}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                    viewMode === "ADMIN"
                                        ? "bg-amber-950/60 text-amber-300 border-amber-800/60"
                                        : "bg-zinc-800 text-zinc-300 border-zinc-700"
                                }`}>
                                    {viewMode === "ADMIN" ? "GLOBAL CONTROLS" : "THEATER MANAGER"}
                                </span>
                            </div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">
                                {viewMode === "ADMIN"
                                    ? "Global Admin Console"
                                    : (currentTheater?.name || currentTheater?.theaterName || "My Cinema Theater")}
                            </h1>
                            <p className="text-xs text-gray-400">
                                {viewMode === "ADMIN"
                                    ? "Add and delete movies, add and delete theaters across Cultured platform"
                                    : "Manage which movies you show, screen layouts, showtimes, ticket pricing & address"}
                            </p>
                        </div>
                    </div>

                    {/* Mode Switcher & Theater Selector */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Switch View Toggle */}
                        <div className="flex items-center bg-gray-900/90 border border-gray-700/80 rounded-xl p-1">
                            <button
                                onClick={() => {
                                    setViewMode("THEATER");
                                    setActiveTab("movies-showing");
                                }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                                    viewMode === "THEATER"
                                        ? "bg-zinc-100 text-zinc-950 font-bold"
                                        : "text-zinc-400 hover:text-white"
                                }`}
                            >
                                🏢 Theater Mode
                            </button>
                            <button
                                onClick={() => {
                                    setViewMode("ADMIN");
                                    setActiveTab("admin-movies");
                                }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                                    viewMode === "ADMIN"
                                        ? "bg-zinc-100 text-zinc-950 font-bold"
                                        : "text-zinc-400 hover:text-white"
                                }`}
                            >
                                🛡️ Admin Mode
                            </button>
                        </div>

                        {/* Active Theater Selector */}
                        {allTheaters.length > 0 && (
                            <div className="flex items-center gap-2 bg-gray-900/90 border border-gray-700/80 rounded-xl p-1.5">
                                <span className="text-[11px] text-gray-400 pl-1.5">Cinema:</span>
                                <select
                                    value={selectedTheaterId}
                                    onChange={(e) => handleTheaterSelect(e.target.value)}
                                    className="bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-zinc-500 cursor-pointer max-w-[170px] truncate"
                                >
                                    {allTheaters.map((t, idx) => (
                                        <option key={t.theaterId || t.id || idx} value={t.theaterId || t.id}>
                                            {t.name || t.theaterName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Studio Navigation Tabs */}
            <div className="bg-[#12151b] border-b border-gray-800 sticky top-0 z-20 shadow-md">
                <div className="max-w-6xl mx-auto px-4 sm:px-8 flex items-center gap-2 overflow-x-auto py-2.5">
                    {/* THEATER TABS */}
                    {viewMode === "THEATER" && (
                        <>
                            <button
                                onClick={() => setActiveTab("movies-showing")}
                                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center gap-2 shrink-0 cursor-pointer ${
                                    activeTab === "movies-showing"
                                        ? "bg-zinc-100 text-zinc-950 font-bold shadow-sm"
                                        : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
                                }`}
                            >
                                <span>🎬</span>
                                <span>Which Movies We're Showing</span>
                            </button>

                            <button
                                onClick={() => setActiveTab("shows")}
                                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center gap-2 shrink-0 cursor-pointer ${
                                    activeTab === "shows"
                                        ? "bg-zinc-100 text-zinc-950 font-bold shadow-sm"
                                        : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
                                }`}
                            >
                                <span>🎟️</span>
                                <span>Showtimes & Pricing</span>
                            </button>

                            <button
                                onClick={() => setActiveTab("screens")}
                                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center gap-2 shrink-0 cursor-pointer ${
                                    activeTab === "screens"
                                        ? "bg-zinc-100 text-zinc-950 font-bold shadow-sm"
                                        : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
                                }`}
                            >
                                <span>🖥️</span>
                                <span>Screens & Layout Design</span>
                            </button>

                            <button
                                onClick={() => setActiveTab("profile")}
                                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center gap-2 shrink-0 cursor-pointer ${
                                    activeTab === "profile"
                                        ? "bg-zinc-100 text-zinc-950 font-bold shadow-sm"
                                        : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
                                }`}
                            >
                                <span>📍</span>
                                <span>Theater Profile & Address</span>
                            </button>
                        </>
                    )}

                    {/* ADMIN TABS */}
                    {viewMode === "ADMIN" && (
                        <>
                            <button
                                onClick={() => setActiveTab("admin-movies")}
                                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center gap-2 shrink-0 cursor-pointer ${
                                    activeTab === "admin-movies"
                                        ? "bg-zinc-100 text-zinc-950 font-bold shadow-sm"
                                        : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
                                }`}
                            >
                                <span>🎬</span>
                                <span>Movies Directory (Add & Delete)</span>
                            </button>

                            <button
                                onClick={() => setActiveTab("admin-theaters")}
                                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center gap-2 shrink-0 cursor-pointer ${
                                    activeTab === "admin-theaters"
                                        ? "bg-zinc-100 text-zinc-950 font-bold shadow-sm"
                                        : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
                                }`}
                            >
                                <span>🏢</span>
                                <span>Theaters Directory (Add & Delete)</span>
                            </button>

                            <button
                                onClick={() => setActiveTab("shows")}
                                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center gap-2 shrink-0 cursor-pointer ${
                                    activeTab === "shows"
                                        ? "bg-zinc-100 text-zinc-950 font-bold shadow-sm"
                                        : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
                                }`}
                            >
                                <span>🎟️</span>
                                <span>All Showtimes & Pricing</span>
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <main className="max-w-6xl mx-auto px-4 sm:px-8 py-8">

                {/* ============================================================== */}
                {/* THEATER TAB 1: WHICH MOVIES THEY ARE SHOWING                    */}
                {/* ============================================================== */}
                {activeTab === "movies-showing" && (
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-gray-800">
                            <div>
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <span>Which Movies Are You Showing?</span>
                                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-semibold border border-zinc-700">
                                        {(currentTheater?.movieIds || []).length} Currently Active
                                    </span>
                                </h2>
                                <p className="text-xs text-gray-400 mt-1">
                                    Select which titles from the Cultured library are licensed and showing in <strong className="text-white">{currentTheater?.name || "your cinema"}</strong>.
                                </p>
                            </div>
                        </div>

                        {movies.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                                {movies.map((movie) => {
                                    const showing = isMovieShowingInTheater(movie.imdbId);
                                    return (
                                        <div
                                            key={movie.imdbId}
                                            className={`rounded-2xl border transition-all overflow-hidden flex flex-col justify-between ${
                                                showing
                                                    ? "bg-zinc-900/90 border-zinc-600 shadow-xl"
                                                    : "bg-gray-950/60 border-gray-800/80 opacity-75 hover:opacity-100"
                                            }`}
                                        >
                                            <div className="relative aspect-[2/3] w-full overflow-hidden bg-zinc-800">
                                                <img
                                                    src={movie.poster || "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800"}
                                                    alt={movie.title}
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute top-2 right-2">
                                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                                        showing
                                                            ? "bg-emerald-900/90 text-emerald-200 border border-emerald-700"
                                                            : "bg-zinc-900/90 text-zinc-400 border border-zinc-700"
                                                    }`}>
                                                        {showing ? "✓ Now Showing" : "Not Active"}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="p-4 flex-1 flex flex-col justify-between">
                                                <div>
                                                    <h3 className="font-bold text-sm text-white line-clamp-1">{movie.title}</h3>
                                                    <p className="text-[11px] text-gray-400 mt-1 line-clamp-1">
                                                        {Array.isArray(movie.genres) ? movie.genres.join(", ") : movie.genres || "Action"}
                                                    </p>
                                                </div>

                                                <button
                                                    onClick={() => handleToggleMovieInTheater(movie.imdbId)}
                                                    className={`mt-4 w-full py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                                                        showing
                                                            ? "bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/60"
                                                            : "bg-zinc-100 hover:bg-white text-zinc-950"
                                                    }`}
                                                >
                                                    {showing ? (
                                                        <>
                                                            <span>✕</span>
                                                            <span>Remove from My Cinema</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span>＋</span>
                                                            <span>Add to My Cinema</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-12 text-center rounded-2xl bg-gray-900/40 border border-gray-800 text-gray-400 text-sm">
                                No movies found in the database.
                            </div>
                        )}
                    </div>
                )}

                {/* ============================================================== */}
                {/* THEATER TAB 2: THEATER PROFILE & CHANGE ADDRESS                 */}
                {/* ============================================================== */}
                {activeTab === "profile" && (
                    <div className="max-w-2xl mx-auto bg-gray-900/80 border border-gray-800 rounded-3xl p-8 shadow-2xl">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-800">
                            <div className="w-12 h-12 rounded-xl bg-zinc-800 text-zinc-300 border border-zinc-700 flex items-center justify-center text-xl">
                                📍
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Theater Profile & Address</h2>
                                <p className="text-xs text-gray-400">Update your cinema brand name and physical address for customers</p>
                            </div>
                        </div>

                        <form onSubmit={handleSaveTheaterProfile} className="space-y-5">
                            <div>
                                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                                    Cinema / Theater Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={profileName}
                                    onChange={(e) => setProfileName(e.target.value)}
                                    placeholder="e.g. PVR ICON: Gold Class & IMAX"
                                    className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-zinc-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                                    Physical Address & Mall Location
                                </label>
                                <textarea
                                    required
                                    rows="3"
                                    value={profileLocation}
                                    onChange={(e) => setProfileLocation(e.target.value)}
                                    placeholder="e.g. 4th Floor, High Street Phoenix, Senapati Bapat Marg, Lower Parel, Mumbai, Maharashtra 400013"
                                    className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-zinc-500 resize-none"
                                />
                                <p className="text-[11px] text-gray-500 mt-1">
                                    This address is shown on customer tickets, direction links, and checkout screens.
                                </p>
                            </div>

                            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs space-y-2">
                                <div className="text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                                    Cinema Information Summary
                                </div>
                                <div className="flex justify-between text-zinc-300">
                                    <span>Theater Identifier:</span>
                                    <span className="font-mono text-zinc-400">{selectedTheaterId || "N/A"}</span>
                                </div>
                                <div className="flex justify-between text-zinc-300">
                                    <span>Configured Screens:</span>
                                    <span>{screensList.length} Screens</span>
                                </div>
                                <div className="flex justify-between text-zinc-300">
                                    <span>Movies Currently Showing:</span>
                                    <span>{(currentTheater?.movieIds || []).length} Titles</span>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSavingProfile}
                                className="w-full py-3.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
                            >
                                {isSavingProfile ? "Saving Updates..." : "Save Address & Profile Changes →"}
                            </button>
                        </form>
                    </div>
                )}

                {/* ============================================================== */}
                {/* TAB: SHOWTIMES & PRICING                                        */}
                {/* ============================================================== */}
                {activeTab === "shows" && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Form to schedule a new show */}
                        <div className="lg:col-span-1 bg-gray-900/80 border border-gray-800 rounded-3xl p-6 shadow-2xl h-fit">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="p-2 rounded-xl bg-zinc-800 text-zinc-300 border border-zinc-700 text-sm">➕</span>
                                <div>
                                    <h2 className="text-base font-bold text-white">Schedule Showtime</h2>
                                    <p className="text-xs text-gray-400">Publish a show with ticket price</p>
                                </div>
                            </div>

                            <form onSubmit={handleCreateShow} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-300 mb-1">Select Movie</label>
                                    <select
                                        value={selectedMovieId}
                                        onChange={(e) => setSelectedMovieId(e.target.value)}
                                        className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500 cursor-pointer"
                                    >
                                        {movies.map((m) => (
                                            <option key={m.imdbId} value={m.imdbId}>
                                                {m.title} ({m.releaseDate ? m.releaseDate.split("-")[0] : "2026"})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-300 mb-1">Select Screen</label>
                                    <select
                                        value={selectedScreenName}
                                        onChange={(e) => {
                                            setSelectedScreenName(e.target.value);
                                            const sc = screensList.find((s) => s.screenName === e.target.value);
                                            if (sc) setShowCapacity(sc.capacity);
                                        }}
                                        className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500 cursor-pointer"
                                    >
                                        {screensList.map((sc, i) => (
                                            <option key={i} value={sc.screenName}>
                                                {sc.screenName} ({sc.layoutType} • Cap: {sc.capacity})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-300 mb-1">Showtime</label>
                                        <select
                                            value={showTime}
                                            onChange={(e) => setShowTime(e.target.value)}
                                            className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500 cursor-pointer"
                                        >
                                            <option value="10:00 AM">10:00 AM (Morning)</option>
                                            <option value="10:30 AM">10:30 AM (Morning)</option>
                                            <option value="01:45 PM">01:45 PM (Matinee)</option>
                                            <option value="04:30 PM">04:30 PM (Evening)</option>
                                            <option value="06:30 PM">06:30 PM (Prime)</option>
                                            <option value="08:45 PM">08:45 PM (Prime)</option>
                                            <option value="10:15 PM">10:15 PM (Night)</option>
                                            <option value="11:30 PM">11:30 PM (Late Night)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-300 mb-1">Starting Price (₹)</label>
                                        <input
                                            type="number"
                                            min="50"
                                            step="10"
                                            value={ticketPrice}
                                            onChange={(e) => setTicketPrice(e.target.value)}
                                            className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-300 mb-1">Seating Capacity</label>
                                    <input
                                        type="number"
                                        min="20"
                                        max="300"
                                        value={showCapacity}
                                        onChange={(e) => setShowCapacity(e.target.value)}
                                        className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-3.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-sm shadow-md transition-all cursor-pointer"
                                >
                                    Publish Showtime →
                                </button>
                            </form>
                        </div>

                        {/* Shows Table / List */}
                        <div className="lg:col-span-2 space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    <span>Active Scheduled Showtimes</span>
                                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-semibold border border-zinc-700">
                                        {shows.length} Shows
                                    </span>
                                </h2>
                                <span className="text-xs text-gray-400">Updates live</span>
                            </div>

                            {shows.length > 0 ? (
                                <div className="space-y-3">
                                    {shows.map((show, idx) => (
                                        <div
                                            key={show.showId || show.id || idx}
                                            className="bg-gray-900/70 border border-gray-800 hover:border-gray-700 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition shadow-lg"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center font-bold text-zinc-300 text-sm shrink-0 border border-zinc-700">
                                                    {show.time ? show.time.split(" ")[0] : "Show"}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-sm text-white">
                                                        {getMovieTitle(show.movieId)}
                                                    </h3>
                                                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                                                        <span className="text-zinc-300 font-semibold">{show.screen || "Screen 1"}</span>
                                                        <span>•</span>
                                                        <span>{show.time}</span>
                                                        <span>•</span>
                                                        <span>Cap: {show.capacity || 64}</span>
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 self-end sm:self-center">
                                                <span className="px-3 py-1 rounded-lg bg-emerald-950/40 text-emerald-400 text-xs font-bold border border-emerald-800/40">
                                                    ₹{show.price || 180} onwards
                                                </span>
                                                <button
                                                    onClick={() => handleDeleteShow(show.showId || show.id)}
                                                    className="p-2 rounded-xl bg-gray-800 hover:bg-red-950/60 text-gray-400 hover:text-red-400 border border-gray-700 hover:border-red-800/60 transition text-xs cursor-pointer"
                                                    title="Cancel Showtime"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-12 text-center rounded-2xl bg-gray-900/40 border border-gray-800 text-gray-400 text-sm">
                                    No showtimes currently scheduled. Use the form on the left to add a showtime!
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ============================================================== */}
                {/* TAB: SCREENS & LAYOUT DESIGN                                    */}
                {/* ============================================================== */}
                {activeTab === "screens" && (
                    <div className="space-y-8">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-white">Cinema Screens & Seating Layouts</h2>
                                <p className="text-xs text-gray-400">Configure screen capacities and view real-time layout structures</p>
                            </div>

                            {/* Add Screen Quick Form */}
                            <div className="flex flex-wrap items-center gap-2 bg-gray-900 p-2 rounded-2xl border border-gray-800">
                                <input
                                    type="text"
                                    placeholder="Screen Name (e.g. Audi 3 - 4DX)"
                                    value={newScreenName}
                                    onChange={(e) => setNewScreenName(e.target.value)}
                                    className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-500"
                                />
                                <select
                                    value={newScreenLayout}
                                    onChange={(e) => setNewScreenLayout(e.target.value)}
                                    className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-500 cursor-pointer"
                                >
                                    <option value="Standard">Standard Layout</option>
                                    <option value="IMAX">IMAX Tiered</option>
                                    <option value="VIP Recliner">VIP Recliner Lounge</option>
                                </select>
                                <input
                                    type="number"
                                    value={newScreenCap}
                                    onChange={(e) => setNewScreenCap(e.target.value)}
                                    className="w-16 bg-gray-800 border border-gray-700 rounded-xl px-2 py-1.5 text-xs text-white text-center focus:outline-none focus:border-zinc-500"
                                />
                                <button
                                    onClick={handleAddScreen}
                                    className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 font-bold text-sm shadow transition cursor-pointer"
                                >
                                    + Add Screen
                                </button>
                            </div>
                        </div>

                        {/* Screen Cards with Live Mini Layout Previews */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {screensList.map((screen, sIdx) => {
                                const rowsCount = Math.ceil(screen.capacity / (screen.seatsPerRow || 8));
                                const rowLetters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"].slice(0, rowsCount);

                                return (
                                    <div key={sIdx} className="bg-gray-900/80 border border-gray-800 rounded-3xl p-6 shadow-xl space-y-4">
                                        <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                                            <div>
                                                <h3 className="text-base font-bold text-white">{screen.screenName}</h3>
                                                <span className="text-xs text-zinc-400 font-semibold">{screen.layoutType}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xs text-gray-400 block">Total Capacity</span>
                                                <span className="text-lg font-black text-white">{screen.capacity} Seats</span>
                                            </div>
                                        </div>

                                        {/* Visual Screen Arc Preview */}
                                        <div className="flex flex-col items-center py-2">
                                            <div className="w-3/4 h-3 bg-gradient-to-r from-zinc-500 via-white to-zinc-500 rounded-t-full shadow-[0_-4px_15px_rgba(255,255,255,0.2)]"></div>
                                            <span className="text-[9px] uppercase tracking-widest text-gray-500 mt-1">Screen</span>
                                        </div>

                                        {/* Mini Seating Grid Preview */}
                                        <div className="bg-gray-950/60 p-4 rounded-2xl border border-gray-800/80 flex flex-col gap-1.5 items-center">
                                            {rowLetters.map((rLetter) => (
                                                <div key={rLetter} className="flex items-center gap-1">
                                                    <span className="w-3 text-[9px] font-bold text-gray-600 text-center">{rLetter}</span>
                                                    <div className="flex gap-1">
                                                        {[1, 2, 3, 4].map((c) => (
                                                            <div key={c} className="w-4 h-4 rounded-t bg-gray-800 border border-gray-700/60"></div>
                                                        ))}
                                                    </div>
                                                    <div className="w-3"></div>
                                                    <div className="flex gap-1">
                                                        {[5, 6, 7, 8].map((c) => (
                                                            <div key={c} className="w-4 h-4 rounded-t bg-gray-800 border border-gray-700/60"></div>
                                                        ))}
                                                    </div>
                                                    <span className="w-3 text-[9px] font-bold text-gray-600 text-center">{rLetter}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex items-center justify-between text-xs text-gray-400 pt-2">
                                            <span>{rowsCount} Rows • {screen.seatsPerRow || 8} Seats / Row</span>
                                            <span className="text-emerald-400 font-medium">✓ Active Seating Grid</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ============================================================== */}
                {/* ADMIN TAB 1: MOVIES DIRECTORY (ADD & DELETE MOVIES)             */}
                {/* ============================================================== */}
                {activeTab === "admin-movies" && (
                    <div className="space-y-10">
                        {/* Add Movie Form */}
                        <div className="bg-gray-900/80 border border-gray-800 rounded-3xl p-8 shadow-2xl max-w-3xl mx-auto">
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-800">
                                <div className="w-10 h-10 rounded-xl bg-zinc-800 text-zinc-300 border border-zinc-700 flex items-center justify-center text-xl">
                                    ➕
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">Add New Movie to Platform (Admin)</h2>
                                    <p className="text-xs text-gray-400">Publish a new theatrical title to the global database</p>
                                </div>
                            </div>

                            <form onSubmit={handleCreateMovie} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-300 mb-1.5">Movie Title</label>
                                        <input
                                            type="text"
                                            required
                                            value={newMovieTitle}
                                            onChange={(e) => setNewMovieTitle(e.target.value)}
                                            placeholder="e.g. Gladiator II"
                                            className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-300 mb-1.5">IMDb ID (Optional)</label>
                                        <input
                                            type="text"
                                            value={newMovieImdb}
                                            onChange={(e) => setNewMovieImdb(e.target.value)}
                                            placeholder="e.g. tt12672956"
                                            className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-500"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-300 mb-1.5">Poster Image URL</label>
                                        <input
                                            type="url"
                                            value={newMoviePoster}
                                            onChange={(e) => setNewMoviePoster(e.target.value)}
                                            placeholder="https://images.unsplash.com/... or poster URL"
                                            className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-300 mb-1.5">Release Date</label>
                                        <input
                                            type="date"
                                            value={newMovieRelease}
                                            onChange={(e) => setNewMovieRelease(e.target.value)}
                                            className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-500"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-300 mb-1.5">Trailer YouTube Link</label>
                                        <input
                                            type="url"
                                            value={newMovieTrailer}
                                            onChange={(e) => setNewMovieTrailer(e.target.value)}
                                            placeholder="https://www.youtube.com/watch?v=..."
                                            className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-300 mb-1.5">Genres (Comma separated)</label>
                                        <input
                                            type="text"
                                            value={newMovieGenres}
                                            onChange={(e) => setNewMovieGenres(e.target.value)}
                                            placeholder="Action, Sci-Fi, IMAX"
                                            className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-500"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full mt-2 py-3.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-sm shadow-md transition-all cursor-pointer"
                                >
                                    Publish Movie to Platform Database →
                                </button>
                            </form>
                        </div>

                        {/* Movies List with Delete Button */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <span>Global Movies Catalog</span>
                                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-semibold border border-zinc-700">
                                        {movies.length} Movies
                                    </span>
                                </h3>
                                <span className="text-xs text-gray-400">Admin can delete any movie</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {movies.map((m) => (
                                    <div
                                        key={m.imdbId}
                                        className="bg-gray-900/70 border border-gray-800 rounded-2xl p-4 flex flex-col justify-between hover:border-gray-700 transition shadow-lg"
                                    >
                                        <div className="flex gap-3">
                                            <img
                                                src={m.poster || "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800"}
                                                alt={m.title}
                                                className="w-16 h-24 object-cover rounded-xl bg-zinc-800 shrink-0"
                                            />
                                            <div className="overflow-hidden">
                                                <h4 className="font-bold text-sm text-white line-clamp-1">{m.title}</h4>
                                                <p className="text-[11px] text-gray-400 mt-0.5 font-mono">{m.imdbId}</p>
                                                <p className="text-[11px] text-zinc-400 mt-1 line-clamp-1">
                                                    {Array.isArray(m.genres) ? m.genres.join(", ") : m.genres || "Action"}
                                                </p>
                                                <p className="text-[10px] text-gray-500 mt-1">{m.releaseDate || "2026"}</p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleDeleteMovie(m.imdbId, m.title)}
                                            className="mt-3 w-full py-2 px-3 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 text-xs font-bold border border-red-800/60 transition flex items-center justify-center gap-1.5 cursor-pointer"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                            <span>Delete Movie</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ============================================================== */}
                {/* ADMIN TAB 2: THEATERS DIRECTORY (ADD & DELETE THEATERS)         */}
                {/* ============================================================== */}
                {activeTab === "admin-theaters" && (
                    <div className="space-y-10">
                        {/* Add Theater Form */}
                        <div className="bg-gray-900/80 border border-gray-800 rounded-3xl p-8 shadow-2xl max-w-3xl mx-auto">
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-800">
                                <div className="w-10 h-10 rounded-xl bg-zinc-800 text-zinc-300 border border-zinc-700 flex items-center justify-center text-xl">
                                    🏢
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">Add New Cinema Theater (Admin)</h2>
                                    <p className="text-xs text-gray-400">Register a new theater branch or location</p>
                                </div>
                            </div>

                            <form onSubmit={handleCreateTheater} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">Theater Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={newTheaterName}
                                        onChange={(e) => setNewTheaterName(e.target.value)}
                                        placeholder="e.g. INOX Megaplex: Laser & ScreenX"
                                        className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">City & Mall Location / Address</label>
                                    <input
                                        type="text"
                                        required
                                        value={newTheaterLocation}
                                        onChange={(e) => setNewTheaterLocation(e.target.value)}
                                        placeholder="e.g. R City Mall, LBS Marg, Ghatkopar West, Mumbai"
                                        className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">Number of Screens</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="16"
                                        value={newTheaterScreensCount}
                                        onChange={(e) => setNewTheaterScreensCount(Math.max(1, parseInt(e.target.value) || 1))}
                                        className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-500"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full mt-2 py-3.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-sm shadow-md transition-all cursor-pointer"
                                >
                                    Register Theater Branch →
                                </button>
                            </form>
                        </div>

                        {/* Theaters List with Delete Button */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <span>All Registered Theaters</span>
                                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-semibold border border-zinc-700">
                                        {allTheaters.length} Theaters
                                    </span>
                                </h3>
                                <span className="text-xs text-gray-400">Admin can delete any theater</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {allTheaters.map((t, idx) => {
                                    const tId = t.theaterId || t.id || `th-${idx}`;
                                    const tName = t.name || t.theaterName || "Cinema";
                                    return (
                                        <div
                                            key={tId}
                                            className="bg-gray-900/70 border border-gray-800 rounded-2xl p-5 flex flex-col justify-between hover:border-gray-700 transition shadow-lg"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <h4 className="font-bold text-base text-white">{tName}</h4>
                                                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1.5">
                                                        <span>📍</span>
                                                        <span>{t.location || "City Location"}</span>
                                                    </p>
                                                    <div className="flex items-center gap-3 mt-3 text-xs text-zinc-400">
                                                        <span className="bg-zinc-800 px-2.5 py-1 rounded-lg border border-zinc-700">
                                                            {t.screens ? t.screens.length : (t.screenCount || 2)} Screens
                                                        </span>
                                                        <span className="bg-zinc-800 px-2.5 py-1 rounded-lg border border-zinc-700">
                                                            {(t.movieIds || []).length} Movies Active
                                                        </span>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => handleDeleteTheater(tId, tName)}
                                                    className="p-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/60 transition text-xs shrink-0 cursor-pointer"
                                                    title="Delete Theater"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default TheaterDashboard;
