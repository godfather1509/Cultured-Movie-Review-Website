import { useState } from "react";
import { NavLink } from "react-router-dom";

function Navbar() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(prev => !prev);
    };

    return (
        <nav className="bg-white border-b border-gray-200 dark:bg-gray-900 dark:border-gray-700">
            <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">

                {/* Logo */}
                <NavLink to="/" className="flex items-center space-x-3 rtl:space-x-reverse">
                    <img src="./public/logo_white.png" className="h-12" alt="Cultured Logo" />
                    <span className="self-center text-2xl font-semibold whitespace-nowrap dark:text-white">Cultured</span>
                </NavLink>

                {/* Centered Search for desktop */}
                <div className="flex-1 mx-4 hidden md:flex justify-center">
                    <div className="relative w-full max-w-md">
                        <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                            <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            id="search-navbar"
                            className="block w-full p-2 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                            placeholder="Search..."
                        />
                    </div>
                </div>

                {/* Desktop links & mobile toggle */}
                <div className="flex items-center md:order-2">
                    {/* Mobile menu toggle */}
                    <button
                        onClick={toggleMobileMenu}
                        type="button"
                        className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
                    >
                        <span className="sr-only">Toggle mobile menu</span>
                        <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 17 14">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 1h15M1 7h15M1 13h15" />
                        </svg>
                    </button>

                    {/* Desktop navigation links */}
                    <div className="hidden md:flex md:ml-4 items-center justify-end space-x-12 rtl:space-x-reverse">
                        <NavLink to="/login" className="text-white hover:text-blue-500 font-bold">Login</NavLink>

                        <NavLink to="/about" className="text-gray-900 dark:text-white hover:text-blue-700 dark:hover:text-blue-500 font-bold">About</NavLink>
                    </div>
                </div>

                {/* Mobile Menu */}
                <div className={`w-full md:hidden mt-4 ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
                    {/* Search bar on mobile */}
                    <div className="relative mb-4">
                        <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                            <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            id="search-navbar-mobile"
                            className="block w-full p-2 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                            placeholder="Search..."
                        />
                    </div>

                    {/* Mobile navigation links */}
                    <ul className="flex flex-col space-y-2 font-medium border border-gray-100 rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 p-3">
                        <li>
                            <NavLink to="/login" className="block py-2 px-3 text-white dark:text-white font-bold">Login</NavLink>
                        </li>
                        <li>
                            <NavLink to="/about" className="block py-2 px-3 text-white font-bold dark:text-white">About</NavLink>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
