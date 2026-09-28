import React, { useState } from "react";
import axios from "axios";
import { User, Lock, Shield, CheckCircle, XCircle, Eye, EyeOff, AlertCircle } from "lucide-react";
import { properties } from '../../Properties/Properties';
function CreateUser() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [role, setRole] = useState("OPERATOR");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    // Password strength indicator
    const getPasswordStrength = (pass) => {
        if (!pass) return { strength: 0, label: "", color: "" };
        let strength = 0;
        if (pass.length >= 8) strength++;
        if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) strength++;
        if (/\d/.test(pass)) strength++;
        if (/[!@#$%^&*(),.?":{}|<>]/.test(pass)) strength++;

        if (strength <= 1) return { strength: 25, label: "Weak", color: "#ef4444" };
        if (strength === 2) return { strength: 50, label: "Fair", color: "#f59e0b" };
        if (strength === 3) return { strength: 75, label: "Good", color: "#3b82f6" };
        return { strength: 100, label: "Strong", color: "#10b981" };
    };

    const passwordStrength = getPasswordStrength(password);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");
        setError("");

        // Validation
        if (password !== confirmPassword) {
            setError("Passwords do not match!");
            setLoading(false);
            return;
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters long!");
            setLoading(false);
            return;
        }

        const payload = {
            username,
            password,
            role: role,
        };

        try {
            const res = await axios.post(
                properties.Port + properties.signupURL,
                payload
            );
            setMessage(`User "${username}" created successfully as ${role}!`);
            // Reset form
            setUsername("");
            setPassword("");
            setConfirmPassword("");
            setRole("OPERATOR");
        } catch (err) {
            setError(err.response?.data || "Server error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setUsername("");
        setPassword("");
        setConfirmPassword("");
        setRole("OPERATOR");
        setMessage("");
        setError("");
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
            <div className="w-full max-w-2xl">
                {/* Header Section */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg mb-4">
                        <User className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Create New User</h1>
                    <p className="text-gray-600 text-lg">Add a new operator or manager to the system</p>
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    <div onSubmit={handleSubmit}>
                        <div className="p-8 space-y-6">
                            {/* Success Message */}
                            {message && (
                                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg flex items-start space-x-3 animate-fade-in">
                                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="font-semibold text-green-900">Success!</p>
                                        <p className="text-green-700 text-sm">{message}</p>
                                    </div>
                                </div>
                            )}

                            {/* Error Message */}
                            {error && (
                                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-start space-x-3 animate-fade-in">
                                    <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="font-semibold text-red-900">Error</p>
                                        <p className="text-red-700 text-sm">{error}</p>
                                    </div>
                                </div>
                            )}

                            {/* Role Selection */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3">
                                    <Shield className="w-4 h-4 inline mr-2" />
                                    User Role
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setRole("OPERATOR")}
                                        className={`p-4 rounded-xl border-2 transition-all ${role === "OPERATOR"
                                            ? "border-blue-500 bg-blue-50 shadow-md"
                                            : "border-gray-200 hover:border-gray-300"
                                            }`}
                                    >
                                        <div className="flex items-center justify-center space-x-2">
                                            <User className={`w-5 h-5 ${role === "OPERATOR" ? "text-blue-600" : "text-gray-500"}`} />
                                            <span className={`font-semibold ${role === "OPERATOR" ? "text-blue-900" : "text-gray-700"}`}>
                                                Operator
                                            </span>
                                        </div>
                                        <p className={`text-xs mt-2 ${role === "OPERATOR" ? "text-blue-700" : "text-gray-500"}`}>
                                            Standard user access
                                        </p>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setRole("MANAGER")}
                                        className={`p-4 rounded-xl border-2 transition-all ${role === "MANAGER"
                                            ? "border-blue-500 bg-blue-50 shadow-md"
                                            : "border-gray-200 hover:border-gray-300"
                                            }`}
                                    >
                                        <div className="flex items-center justify-center space-x-2">
                                            <Shield className={`w-5 h-5 ${role === "MANAGER" ? "text-blue-600" : "text-gray-500"}`} />
                                            <span className={`font-semibold ${role === "MANAGER" ? "text-blue-900" : "text-gray-700"}`}>
                                                Manager
                                            </span>
                                        </div>
                                        <p className={`text-xs mt-2 ${role === "MANAGER" ? "text-blue-700" : "text-gray-500"}`}>
                                            Full system access
                                        </p>
                                    </button>
                                </div>
                            </div>

                            {/* Username Field */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Username
                                </label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Enter username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        required
                                        className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all text-gray-900 placeholder-gray-400"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-2">Choose a unique username for the user</p>
                            </div>

                            {/* Password Field */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Enter strong password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="w-full pl-12 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all text-gray-900 placeholder-gray-400"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>

                                {/* Password Strength Indicator */}
                                {password && (
                                    <div className="mt-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-medium text-gray-600">Password Strength:</span>
                                            <span className="text-xs font-semibold" style={{ color: passwordStrength.color }}>
                                                {passwordStrength.label}
                                            </span>
                                        </div>
                                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full transition-all duration-300 rounded-full"
                                                style={{
                                                    width: `${passwordStrength.strength}%`,
                                                    backgroundColor: passwordStrength.color,
                                                }}
                                            />
                                        </div>
                                        <div className="mt-2 space-y-1">
                                            <p className="text-xs text-gray-500 flex items-center">
                                                <span className={password.length >= 8 ? "text-green-600" : "text-gray-400"}>
                                                    {password.length >= 8 ? "✓" : "○"}
                                                </span>
                                                <span className="ml-2">At least 8 characters</span>
                                            </p>
                                            <p className="text-xs text-gray-500 flex items-center">
                                                <span className={/[A-Z]/.test(password) && /[a-z]/.test(password) ? "text-green-600" : "text-gray-400"}>
                                                    {/[A-Z]/.test(password) && /[a-z]/.test(password) ? "✓" : "○"}
                                                </span>
                                                <span className="ml-2">Upper and lowercase letters</span>
                                            </p>
                                            <p className="text-xs text-gray-500 flex items-center">
                                                <span className={/\d/.test(password) ? "text-green-600" : "text-gray-400"}>
                                                    {/\d/.test(password) ? "✓" : "○"}
                                                </span>
                                                <span className="ml-2">At least one number</span>
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password Field */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="Re-enter password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        className={`w-full pl-12 pr-12 py-3 border-2 rounded-xl focus:ring-4 outline-none transition-all text-gray-900 placeholder-gray-400 ${confirmPassword && password !== confirmPassword
                                            ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                                            : "border-gray-200 focus:border-blue-500 focus:ring-blue-100"
                                            }`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                {confirmPassword && password !== confirmPassword && (
                                    <p className="text-xs text-red-600 mt-2 flex items-center">
                                        <AlertCircle className="w-3 h-3 mr-1" />
                                        Passwords do not match
                                    </p>
                                )}
                                {confirmPassword && password === confirmPassword && (
                                    <p className="text-xs text-green-600 mt-2 flex items-center">
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        Passwords match
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Footer with Actions */}
                        <div className="bg-gray-50 px-8 py-6 flex items-center justify-end space-x-4">
                            <button
                                type="button"
                                onClick={handleReset}
                                className="px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-white transition-all"
                            >
                                Reset Form
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={loading || !username || !password || !confirmPassword || password !== confirmPassword}
                                className={`px-8 py-3 rounded-xl font-semibold transition-all flex items-center space-x-2 ${loading || !username || !password || !confirmPassword || password !== confirmPassword
                                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                    : "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl"
                                    }`}
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        <span>Creating User...</span>
                                    </>
                                ) : (
                                    <>
                                        <User className="w-5 h-5" />
                                        <span>Create User</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Info Card */}
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-start space-x-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-semibold text-blue-900 mb-1">Security Guidelines</p>
                            <ul className="text-xs text-blue-700 space-y-1">
                                <li>• Passwords must be at least 8 characters long</li>
                                <li>• Use a combination of uppercase, lowercase, numbers, and symbols</li>
                                <li>• Operators have standard access, Managers have full system access</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes fade-in {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out;
                }
                @keyframes spin {
                    to {
                        transform: rotate(360deg);
                    }
                }
                .animate-spin {
                    animation: spin 1s linear infinite;
                }
            `}</style>
        </div>
    );
}

export default CreateUser;