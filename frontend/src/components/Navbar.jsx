import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { user, logout, isAdmin, isTheater } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    return (
        <nav className="bg-[#0b0d10] border-b border-zinc-800 sticky top-0 z-40 backdrop-blur-md">
            <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-3.5 px-4 sm:px-8">
                {/* Logo */}
                <NavLink to="/" className="flex items-center space-x-3 rtl:space-x-reverse group">
                    <img src="/logo_white.png" className="h-9 transition-transform group-hover:scale-105" alt="Cultured Logo" />
                    <span className="self-center text-xl font-bold tracking-tight text-white group-hover:text-zinc-300 transition-colors">
                        Cultured
                    </span>
                </NavLink>

                {/* Centered Search for desktop */}
                <div className="flex-1 mx-6 hidden md:flex justify-center">
                    <div className="relative w-full max-w-md">
                        <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none text-zinc-500">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 20 20">
                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            className="block w-full py-2 ps-10 pe-4 text-xs text-zinc-100 border border-zinc-800 rounded-lg bg-zinc-900/90 focus:border-zinc-500 focus:outline-none transition-colors placeholder-zinc-500"
                            placeholder="Search movies, cinemas, or showtimes..."
                        />
                    </div>
                </div>

                {/* Right side navigation links */}
                <div className="flex items-center gap-3">
                    {/* My Tickets Button */}
                    <NavLink
                        to="/my-tickets"
                        className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-700/80 text-sm font-semibold tracking-tight shadow-sm transition-all duration-200 cursor-pointer"
                    >
                        <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                        </svg>
                        <span>My Tickets</span>
                    </NavLink>

                    {/* Role-based Dashboard button */}
                    {isAdmin && (
                        <NavLink
                            to="/admin"
                            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 hover:text-white border border-zinc-600 text-sm font-semibold tracking-tight shadow-sm transition-all duration-200 cursor-pointer"
                        >
                            <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            <span>Admin Console</span>
                        </NavLink>
                    )}

                    {isTheater && (
                        <NavLink
                            to="/theater-dashboard"
                            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 hover:text-white border border-zinc-600 text-sm font-semibold tracking-tight shadow-sm transition-all duration-200 cursor-pointer"
                        >
                            <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <span>Theater Studio</span>
                        </NavLink>
                    )}

                    {!user ? (
                        <NavLink
                            to="/login"
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-sm tracking-tight shadow-sm transition-all duration-200 cursor-pointer"
                        >
                            <span>Sign In</span>
                        </NavLink>
                    ) : (
                        <div className="flex items-center gap-2 pl-1 border-l border-zinc-800">
                            <div className="hidden sm:flex flex-col text-right">
                                <span className="text-xs font-semibold text-zinc-200 truncate max-w-[120px]">
                                    {user.name || user.email}
                                </span>
                                <span className="text-[10px] font-mono text-zinc-400">
                                    {isAdmin ? "Administrator" : isTheater ? "Theater Partner" : "Normal User"}
                                </span>
                            </div>
                            <button
                                onClick={handleLogout}
                                title="Sign Out"
                                className="px-3 py-2 rounded-lg bg-zinc-900 hover:bg-red-950/60 text-zinc-400 hover:text-red-300 border border-zinc-800 hover:border-red-800/60 text-xs font-semibold transition cursor-pointer"
                            >
                                Sign Out
                            </button>
                        </div>
                    )}

                    {/* Mobile menu toggle */}
                    <button
                        onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                        type="button"
                        className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-zinc-400 rounded-lg md:hidden hover:bg-zinc-800 focus:outline-none"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 17 14">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 1h15M1 7h15M1 13h15" />
                        </svg>
                    </button>
                </div>

                {/* Mobile Menu */}
                <div className={`w-full md:hidden mt-3 ${isMobileMenuOpen ? "block" : "hidden"}`}>
                    <div className="flex flex-col gap-2 p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-sm">
                        <NavLink
                            to="/my-tickets"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="py-3 px-4 rounded-lg bg-zinc-900 text-zinc-200 font-semibold border border-zinc-700 flex items-center gap-2"
                        >
                            <span>My Booked Tickets</span>
                        </NavLink>
                        {isAdmin && (
                            <NavLink
                                to="/admin"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="py-3 px-4 rounded-lg bg-zinc-800 text-zinc-100 font-semibold border border-zinc-600 flex items-center gap-2"
                            >
                                <span>Admin Console (Movies & Theaters)</span>
                            </NavLink>
                        )}
                        {isTheater && (
                            <NavLink
                                to="/theater-dashboard"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="py-3 px-4 rounded-lg bg-zinc-800 text-zinc-100 font-semibold border border-zinc-600 flex items-center gap-2"
                            >
                                <span>Theater Studio (Shows, Screens & Profile)</span>
                            </NavLink>
                        )}
                        {user ? (
                            <button
                                onClick={() => {
                                    handleLogout();
                                    setIsMobileMenuOpen(false);
                                }}
                                className="py-3 px-4 rounded-lg bg-red-950/40 text-red-300 font-semibold border border-red-800/60 text-left"
                            >
                                Sign Out ({user.name || user.email})
                            </button>
                        ) : (
                            <NavLink
                                to="/login"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="py-3 px-4 rounded-lg bg-zinc-100 text-zinc-950 font-bold text-center"
                            >
                                Sign In
                            </NavLink>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
