// import React, { useState, useEffect } from 'react';
// import { checkBackendConnection } from '../services/api';

// const SystemStatus = () => {
//   const [backendStatus, setBackendStatus] = useState({ connected: false, loading: true });

//   useEffect(() => {
//     checkStatus();
//     const interval = setInterval(checkStatus, 30000); // Check every 30 seconds
//     return () => clearInterval(interval);
//   }, []);

//   const checkStatus = async () => {
//     setBackendStatus(prev => ({ ...prev, loading: true }));
//     const result = await checkBackendConnection();
//     setBackendStatus({ ...result, loading: false });
//   };

//   return (
//     <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border">
//       <h4 className="font-semibold mb-2">System Status</h4>
//       <div className="flex items-center space-x-2">
//         <div className={`w-3 h-3 rounded-full ${backendStatus.loading ? 'bg-yellow-500' : backendStatus.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
//         <span>Backend API</span>
//       </div>
//       {backendStatus.connected && (
//         <div className="text-xs text-gray-600 mt-1">
//           Localhost:8000 ✓
//         </div>
//       )}
//     </div>
//   );
// };

// export default SystemStatus;