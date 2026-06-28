import { createAdminClient } from '@/utils/supabase/admin'
import os from 'os'

export default async function SamtricsDashboard() {
  const supabase = createAdminClient()
  
  const { data: logs } = await supabase
    .from('samtrics_audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Samtrics Omniscient Monitor</h1>
        <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full font-bold flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          Connected to Samtrics SOC
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-2">System Uptime</h3>
          <p className="text-3xl font-bold text-gray-900">{Math.floor(os.uptime() / 3600)} Hours</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-2">Memory Usage</h3>
          <p className="text-3xl font-bold text-gray-900">
            {Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-2">DB Connection</h3>
          <p className="text-3xl font-bold text-green-600">Online & Secured</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50">
          <h2 className="text-xl font-bold text-gray-900">Live Security Audit Log</h2>
          <p className="text-gray-500 text-sm mt-1">Real-time events broadcasting to Samtrics</p>
        </div>
        
        <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
          {logs && logs.length > 0 ? (
            logs.map((log: any) => (
              <div key={log.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                      ${log.severity === 'CRITICAL' ? 'bg-red-100 text-red-700' : 
                        log.severity === 'WARNING' ? 'bg-orange-100 text-orange-700' : 
                        'bg-blue-100 text-blue-700'}`}>
                      {log.severity}
                    </span>
                    <h3 className="font-bold text-gray-900">{log.event_type}</h3>
                  </div>
                  <span className="text-gray-400 text-sm font-mono">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
                <pre className="mt-3 bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto font-mono">
                  {JSON.stringify(log.details, null, 2)}
                </pre>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-gray-500">
              <span className="material-symbols-outlined text-[48px] mb-4 opacity-50">monitoring</span>
              <p>Waiting for events to arrive... Run the samtrics_setup.sql script first.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
