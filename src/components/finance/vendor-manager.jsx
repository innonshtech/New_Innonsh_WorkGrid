"use client";

import { useState } from "react";
import { 
    LayoutDashboard, Users, CreditCard, 
    IndianRupee, ChevronRight, Settings,
    FileText, Activity, MoreVertical
} from "lucide-react";
import VendorDashboard from "./vendor-dashboard";
import VendorMaster from "./vendor-master";
import VendorExpenses from "./vendor-expenses";
import VendorPayments from "./vendor-payments";
import VendorDetails from "./vendor-details";

export default function VendorManager({ activeSection = 'dashboard', setActiveSection }) {
    const [selectedVendor, setSelectedVendor] = useState(null);

    const renderContent = () => {
        if (selectedVendor) {
            return <VendorDetails vendor={selectedVendor} onBack={() => setSelectedVendor(null)} />;
        }

        switch (activeSection) {
            case 'dashboard': return <VendorDashboard />;
            case 'master': return <VendorMaster onSelectVendor={setSelectedVendor} />;
            case 'expenses': return <VendorExpenses />;
            case 'payments': return <VendorPayments />;
            default: return <VendorDashboard />;
        }
    };

    return (
        <div className="flex flex-col gap-8 animate-in fade-in duration-500 min-h-[600px] relative">
            {/* Main Content Area - Full Width */}
            <div className="w-full">
                {renderContent()}
            </div>
        </div>
    );
}

