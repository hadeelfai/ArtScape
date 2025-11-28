import { X } from "lucide-react";

export default function SettingsSidebar({ open, setOpen }) {

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-[9997]"
          onClick={() => setOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-white shadow-xl z-[9998] transform transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 pt-24">
          <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
          <button
            onClick={() => setOpen(false)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors">
              <p className="font-medium text-gray-900">Account Settings</p>
              <p className="text-sm text-gray-500">Manage your account preferences</p>
            </button>
            
            <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors">
              <p className="font-medium text-gray-900">Privacy & Security</p>
              <p className="text-sm text-gray-500">Control your privacy settings</p>
            </button>
            
            <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors">
              <p className="font-medium text-gray-900">Notifications</p>
              <p className="text-sm text-gray-500">Manage notification preferences</p>
            </button>
            
            <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors">
              <p className="font-medium text-gray-900">Blocked Users</p>
              <p className="text-sm text-gray-500">View and manage blocked accounts</p>
            </button>
            
            <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors">
              <p className="font-medium text-gray-900">Help & Support</p>
              <p className="text-sm text-gray-500">Get help with ArtScape</p>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
