"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Save, X, MapPin } from "lucide-react";
import { toast } from "react-hot-toast";

export default function OfficeLocationSettings({ organizationId }) {
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        address: { street: "", city: "", state: "", zipCode: "", country: "" },
        coordinates: { latitude: "", longitude: "" },
        radius: 100,
        isActive: true,
    });

    useEffect(() => {
        if (organizationId) {
            fetchLocations();
        }
    }, [organizationId]);

    const fetchLocations = async () => {
        try {
            const res = await fetch(`/api/settings/office-locations?organizationId=${organizationId}`);
            if (!res.ok) throw new Error("Failed to fetch locations");
            const data = await res.json();
            setLocations(data.locations || []);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load office locations");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e, section = null) => {
        const { name, value, type, checked } = e.target;

        if (section) {
            setFormData(prev => ({
                ...prev,
                [section]: {
                    ...prev[section],
                    [name]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === "checkbox" ? checked : value
            }));
        }
    };

    const resetForm = () => {
        setFormData({
            name: "",
            address: { street: "", city: "", state: "", zipCode: "", country: "" },
            coordinates: { latitude: "", longitude: "" },
            radius: 100,
            isActive: true,
        });
        setIsAdding(false);
        setEditingId(null);
    };

    const handleEdit = (location) => {
        setFormData({
            name: location.name,
            address: location.address || { street: "", city: "", state: "", zipCode: "", country: "" },
            coordinates: location.coordinates,
            radius: location.radius,
            isActive: location.isActive,
        });
        setEditingId(location._id);
        setIsAdding(true);
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.coordinates.latitude || !formData.coordinates.longitude) {
            toast.error("Name and Coordinates are required");
            return;
        }

        try {
            const url = editingId
                ? `/api/settings/office-locations`
                : `/api/settings/office-locations`;

            const method = editingId ? "PUT" : "POST";
            const body = editingId ? { ...formData, id: editingId } : { ...formData, organizationId };

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Operation failed");

            toast.success(editingId ? "Location updated" : "Location added successfully");
            fetchLocations();
            resetForm();
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this location?")) return;

        try {
            const res = await fetch(`/api/settings/office-locations?id=${id}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Failed to delete");

            setLocations(locations.filter((l) => l._id !== id));
            toast.success("Location deleted");
        } catch (error) {
            toast.error(error.message);
        }
    };

    const getCurrentLocation = () => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition((position) => {
                setFormData(prev => ({
                    ...prev,
                    coordinates: {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    }
                }));
                toast.success("Current location fetched!");
            }, (error) => {
                toast.error("Error getting location: " + error.message);
            });
        } else {
            toast.error("Geolocation is not supported by this browser.");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
                <div>
                    <h2 className="text-lg font-bold text-slate-900">Office Locations & Geo-fencing</h2>
                    <p className="text-sm text-slate-500">Manage office coordinates for attendance validation</p>
                </div>
                {!isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                    >
                        <Plus size={18} />
                        <span>Add Location</span>
                    </button>
                )}
            </div>

            {isAdding && (
                <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-6 animate-in fade-in slide-in-from-top-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-slate-800">{editingId ? 'Edit Location' : 'New Office Location'}</h3>
                        <button onClick={resetForm} className="text-slate-400 hover:text-slate-600">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Basic Info */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Location Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                    placeholder="e.g. Bangalore HQ"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Latitude</label>
                                    <input
                                        type="number"
                                        name="latitude"
                                        value={formData.coordinates.latitude}
                                        onChange={(e) => handleInputChange(e, 'coordinates')}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Longitude</label>
                                    <input
                                        type="number"
                                        name="longitude"
                                        value={formData.coordinates.longitude}
                                        onChange={(e) => handleInputChange(e, 'coordinates')}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none"
                                    />
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={getCurrentLocation}
                                className="text-sm text-indigo-600 font-medium hover:underline flex items-center gap-1"
                            >
                                <MapPin size={14} /> Fetch Current Location
                            </button>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Geo-fence Radius (meters)</label>
                                <input
                                    type="number"
                                    name="radius"
                                    value={formData.radius}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none"
                                />
                                <p className="text-xs text-slate-400 mt-1">Employees must be within this range to mark attendance.</p>
                            </div>
                        </div>

                        {/* Address Info */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Street Address</label>
                                <input
                                    type="text"
                                    name="street"
                                    value={formData.address.street}
                                    onChange={(e) => handleInputChange(e, 'address')}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">City</label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={formData.address.city}
                                        onChange={(e) => handleInputChange(e, 'address')}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">State</label>
                                    <input
                                        type="text"
                                        name="state"
                                        value={formData.address.state}
                                        onChange={(e) => handleInputChange(e, 'address')}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-3 mt-8">
                                <input
                                    type="checkbox"
                                    name="isActive"
                                    checked={formData.isActive}
                                    onChange={handleInputChange}
                                    className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500"
                                    id="isActive"
                                />
                                <label htmlFor="isActive" className="text-sm font-bold text-slate-700">Location Active</label>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <button
                            onClick={resetForm}
                            className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center gap-2"
                        >
                            <Save size={18} />
                            {editingId ? "Update Location" : "Save Location"}
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full text-center py-10 text-slate-500">Loading locations...</div>
                ) : locations.length === 0 ? (
                    <div className="col-span-full text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                        <MapPin className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">No office locations found. Add one to enable Geo-fencing.</p>
                    </div>
                ) : (
                    locations.map((loc) => (
                        <div key={loc._id} className="bg-white rounded-xl border border-slate-200 hover: transition overflow-hidden group">
                            <div className="p-5">
                                <div className="flex justify-between items-start mb-3">
                                    <h3 className="font-bold text-slate-800 text-lg">{loc.name}</h3>
                                    <span className={`px-2 py-1 text-xs font-semibold rounded ${loc.isActive ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                        {loc.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <div className="space-y-2 text-sm text-slate-600">
                                    <div className="flex items-center gap-2">
                                        <MapPin size={16} className="text-slate-400" />
                                        <span>{loc.address?.city}, {loc.address?.state}</span>
                                    </div>
                                    <p className="pl-6 text-xs text-slate-400 font-mono">
                                        {Number(loc.coordinates?.latitude || 0).toFixed(6)}, {Number(loc.coordinates?.longitude || 0).toFixed(6)}
                                    </p>
                                    <div className="pl-6 pt-1 flex items-center gap-2">
                                        <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-xs font-medium">Radius: {loc.radius}m</span>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleEdit(loc)}
                                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-white rounded transition"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(loc._id)}
                                    className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-white rounded transition"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
