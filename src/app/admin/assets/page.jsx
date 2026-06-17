"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Search, Filter, Box, ArrowLeft, Laptop, Smartphone, Monitor, HardDrive, Headphones, Briefcase, Share, Package } from "lucide-react";
import CreateProductModal from "@/components/modals/CreateProductModal";
import CheckoutAssetModal from "@/components/modals/CheckoutAssetModal";
import EditAssetModal from "@/components/modals/EditAssetModal";
import { toast } from "sonner";

export default function AssetsPage() {
    const [vaultProducts, setVaultProducts] = useState([]);
    const [deployedAssets, setDeployedAssets] = useState([]);
    
    const [loading, setLoading] = useState(true);
    const [isCreateProductModalOpen, setIsCreateProductModalOpen] = useState(false);
    const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [filterStatus, setFilterStatus] = useState("");
    
    // Track the currently selected Vault Product for Tier 2 view
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchData = async () => {
        try {
            setLoading(true);
            
            const [productsRes, assetsRes] = await Promise.all([
                fetch("/api/v1/admin/asset-products"),
                fetch("/api/v1/admin/assets")
            ]);
            
            if (productsRes.ok && assetsRes.ok) {
                const pData = await productsRes.json();
                const aData = await assetsRes.json();
                
                setVaultProducts(pData.data || []);
                setDeployedAssets(aData.data || []);
            }
        } catch (error) {
            console.error("Failed to fetch asset data", error);
            toast.error("Failed to load inventory");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Merge deployed stats into vault products (Tier 1 Data)
    const vaultStats = useMemo(() => {
        return vaultProducts.map(product => {
            const productAssets = deployedAssets.filter(a => a.productCatalogId?._id === product._id || a.productCatalogId === product._id);
            
            let deployed = 0;
            let maintenance = 0;
            
            productAssets.forEach(a => {
                if (['In Repair', 'Damaged', 'Lost'].includes(a.status)) {
                    maintenance++;
                } else if (a.status === 'Assigned') {
                    deployed++;
                }
            });
            
            // Available is Total - (Deployed + Maintenance)
            // (Assuming 'Retired' is ignored or subtracted from total, but we keep it simple here)
            const activeAssets = deployed + maintenance;
            const available = Math.max(0, product.totalQuantity - activeAssets);
            
            return {
                ...product,
                deployed,
                maintenance,
                available
            };
        });
    }, [vaultProducts, deployedAssets]);

    // Derived assets for Tier 2 Table (Assets deployed from selected product)
    const displayedAssets = useMemo(() => {
        if (!selectedProduct) return [];
        
        let filtered = deployedAssets.filter(a => a.productCatalogId?._id === selectedProduct._id || a.productCatalogId === selectedProduct._id);
        
        if (filterStatus) {
            filtered = filtered.filter(a => a.status === filterStatus);
        }
        
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(a => 
                (a.name || "").toLowerCase().includes(term) ||
                (a.assetId || "").toLowerCase().includes(term) ||
                (a.serialNumber || "").toLowerCase().includes(term)
            );
        }
        
        return filtered;
    }, [deployedAssets, selectedProduct, searchTerm, filterStatus]);

    const getCategoryIcon = (category) => {
        const c = (category || "").toLowerCase();
        if (c.includes('laptop') || c.includes('computer') || c.includes('macbook')) return <Laptop size={24} className="text-indigo-600" />;
        if (c.includes('phone') || c.includes('mobile')) return <Smartphone size={24} className="text-emerald-600" />;
        if (c.includes('monitor') || c.includes('display')) return <Monitor size={24} className="text-blue-600" />;
        if (c.includes('drive') || c.includes('storage')) return <HardDrive size={24} className="text-orange-600" />;
        if (c.includes('audio') || c.includes('headphone')) return <Headphones size={24} className="text-pink-600" />;
        return <Briefcase size={24} className="text-slate-600" />;
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        {selectedProduct ? `${selectedProduct.name} - Deployed Assets` : "Asset Inventory Vault"}
                    </h1>
                    <p className="text-slate-500 mt-1">
                        {selectedProduct 
                            ? `Track all deployed units of ${selectedProduct.name}` 
                            : "Manage master product catalog and deploy items to employees"}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {selectedProduct && (
                        <button
                            onClick={() => {
                                setSelectedProduct(null);
                                setSearchTerm("");
                                setFilterStatus("");
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-all font-medium"
                        >
                            <ArrowLeft size={18} />
                            Back to Vault
                        </button>
                    )}
                    
                    {!selectedProduct && (
                        <>
                            <button
                                onClick={() => setIsCreateProductModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-indigo-700 rounded-lg hover:bg-indigo-50 transition-all font-medium"
                            >
                                <Package size={18} />
                                Add to Vault
                            </button>
                            <button
                                onClick={() => setIsCheckoutModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all font-medium hover:"
                            >
                                <Share size={18} />
                                Checkout Asset
                            </button>
                        </>
                    )}
                </div>
            </div>

            {!selectedProduct ? (
                // TIER 1: INVENTORY VAULT DASHBOARD
                <div className="space-y-6">
                    {loading ? (
                        <div className="text-center p-12 text-slate-500 bg-white rounded-xl border border-slate-200 flex justify-center items-center gap-3">
                            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                            Loading vault inventory...
                        </div>
                    ) : vaultStats.length === 0 ? (
                        <div className="text-center p-12 text-slate-500 bg-white rounded-xl border border-slate-200">
                            <Box size={48} className="mx-auto text-slate-300 mb-3" />
                            <p className="font-medium text-slate-700 text-lg">Your vault is empty</p>
                            <p className="text-slate-500 mt-1">Add a product to the vault to begin tracking inventory.</p>
                            <button
                                onClick={() => setIsCreateProductModalOpen(true)}
                                className="mt-4 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg font-medium hover:bg-indigo-100 transition-colors inline-flex items-center gap-2"
                            >
                                <Plus size={16} /> Add First Product
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {vaultStats.map((stat) => (
                                <div 
                                    key={stat._id} 
                                    onClick={() => setSelectedProduct(stat)}
                                    className="bg-white rounded-xl border border-slate-200 p-6 hover: hover:border-indigo-300 transition-all cursor-pointer group relative overflow-hidden"
                                >
                                    {stat.available === 0 && (
                                        <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                                            OUT OF STOCK
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between mb-4 mt-2">
                                        <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center group-hover:bg-indigo-50 transition-colors border border-slate-100">
                                            {getCategoryIcon(stat.category)}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-3xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{stat.totalQuantity}</p>
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Quantity</p>
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-1">{stat.name}</h3>
                                    <p className="text-sm text-slate-500 mb-5">{stat.category}</p>
                                    
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded font-semibold border border-emerald-100 flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Available
                                            </span>
                                            <span className="font-bold text-slate-700">{stat.available}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-blue-700 bg-blue-50 px-2.5 py-1 rounded font-semibold border border-blue-100 flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Deployed
                                            </span>
                                            <span className="font-bold text-slate-700">{stat.deployed}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-orange-700 bg-orange-50 px-2.5 py-1 rounded font-semibold border border-orange-100 flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span> Maintenance
                                            </span>
                                            <span className="font-bold text-slate-700">{stat.maintenance}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                // TIER 2: DEPLOYED INDIVIDUAL ASSETS TABLE
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center gap-4 bg-slate-50/50">
                        <div className="relative flex-1 w-full max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="text" 
                                placeholder="Search deployed assets by ID or Serial..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none" 
                            />
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <Filter size={18} className="text-slate-400" />
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="bg-white px-3 py-2 rounded-lg border border-slate-300 font-medium text-slate-700 outline-none cursor-pointer focus:ring-2 focus:ring-indigo-100"
                            >
                                <option value="">All Statuses</option>
                                <option value="Assigned">Assigned (Deployed)</option>
                                <option value="In Repair">In Repair</option>
                                <option value="Damaged">Damaged</option>
                                <option value="Lost">Lost</option>
                                <option value="Retired">Retired</option>
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4">Asset / Serial ID</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Assigned To</th>
                                    <th className="px-6 py-4">Checkout Date</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr><td colSpan="5" className="p-12 text-center text-slate-500">Loading deployed assets...</td></tr>
                                ) : displayedAssets.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="p-12 text-center text-slate-500 flex flex-col items-center">
                                            <Box size={40} className="text-slate-200 mb-2" />
                                            No {selectedProduct.name} units have been checked out yet.
                                        </td>
                                    </tr>
                                ) : (
                                    displayedAssets.map((asset) => (
                                        <tr key={asset._id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-start gap-3">
                                                    <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 mt-0.5">
                                                        <Box size={16} />
                                                    </div>
                                                    <div>
                                                        <div className="font-mono font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 inline-block mb-1">{asset.assetId}</div>
                                                        {asset.serialNumber && <div className="text-xs text-slate-500 font-mono">SN: {asset.serialNumber}</div>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border
                                                    ${asset.status === 'Available' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                        asset.status === 'Assigned' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                        asset.status === 'In Repair' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                                            'bg-slate-100 text-slate-700 border-slate-200'}`}>
                                                    {asset.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {asset.assignedTo ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-bold border border-indigo-200">
                                                            {typeof asset.assignedTo === 'string' 
                                                                ? asset.assignedTo.charAt(0).toUpperCase() 
                                                                : asset.assignedTo.personalDetails?.firstName?.charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className="text-slate-900 font-medium">
                                                            {typeof asset.assignedTo === 'string' 
                                                                ? asset.assignedTo 
                                                                : `${asset.assignedTo.personalDetails?.firstName} ${asset.assignedTo.personalDetails?.lastName} (${asset.assignedTo.employeeId || 'No ID'})`}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 font-medium italic">Unassigned (Returned)</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-slate-500">
                                                {new Date(asset.createdAt).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' })}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => {
                                                        setSelectedAsset(asset);
                                                        setIsEditModalOpen(true);
                                                    }}
                                                    className="text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-md font-medium text-sm transition-colors border border-indigo-100"
                                                >
                                                    Manage Status
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <CreateProductModal
                isOpen={isCreateProductModalOpen}
                onClose={() => setIsCreateProductModalOpen(false)}
                onSuccess={() => {
                    fetchData();
                }}
            />

            <CheckoutAssetModal
                isOpen={isCheckoutModalOpen}
                onClose={() => setIsCheckoutModalOpen(false)}
                vaultProducts={vaultStats}
                onSuccess={() => {
                    fetchData();
                }}
            />

            <EditAssetModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setSelectedAsset(null);
                }}
                onSuccess={() => {
                    fetchData();
                }}
                asset={selectedAsset}
            />
        </div>
    );
}
