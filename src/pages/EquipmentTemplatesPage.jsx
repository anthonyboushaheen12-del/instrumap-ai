import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save, Package, Cpu, ChevronDown, ChevronRight } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

// Default equipment templates with standard I/O points
const DEFAULT_TEMPLATES = [
  {
    id: 'vfd-pump',
    name: 'VFD Pump',
    category: 'Pumps',
    description: 'Variable Frequency Drive controlled pump with standard I/O',
    ioPoints: [
      { tag: 'HS-XXX', signalType: 'DI', description: 'Hand Switch Local/Remote' },
      { tag: 'HSR-XXX', signalType: 'DI', description: 'Start Pushbutton' },
      { tag: 'HSS-XXX', signalType: 'DI', description: 'Stop Pushbutton' },
      { tag: 'YI-XXX', signalType: 'DI', description: 'Running Status' },
      { tag: 'YA-XXX', signalType: 'DI', description: 'Fault Alarm' },
      { tag: 'II-XXX', signalType: 'AI', description: 'Motor Current Feedback' },
      { tag: 'SI-XXX', signalType: 'AI', description: 'Speed Feedback' },
      { tag: 'M-XXX', signalType: 'DO', description: 'Motor Start Command' },
      { tag: 'I-XXX', signalType: 'AO', description: 'Speed Reference' },
    ],
  },
  {
    id: 'dol-pump',
    name: 'DOL Pump',
    category: 'Pumps',
    description: 'Direct On-Line starter pump with basic I/O',
    ioPoints: [
      { tag: 'HS-XXX', signalType: 'DI', description: 'Hand Switch Local/Remote' },
      { tag: 'HSR-XXX', signalType: 'DI', description: 'Start Pushbutton' },
      { tag: 'HSS-XXX', signalType: 'DI', description: 'Stop Pushbutton' },
      { tag: 'YI-XXX', signalType: 'DI', description: 'Running Status' },
      { tag: 'YA-XXX', signalType: 'DI', description: 'Fault/Trip Alarm' },
      { tag: 'M-XXX', signalType: 'DO', description: 'Motor Start Command' },
    ],
  },
  {
    id: 'motorized-valve',
    name: 'Motorized Valve (MOV)',
    category: 'Valves',
    description: 'Motor operated valve with position feedback',
    ioPoints: [
      { tag: 'HS-XXX', signalType: 'DI', description: 'Hand Switch Open/Close/Auto' },
      { tag: 'ZSO-XXX', signalType: 'DI', description: 'Valve Position Open' },
      { tag: 'ZSC-XXX', signalType: 'DI', description: 'Valve Position Closed' },
      { tag: 'YA-XXX', signalType: 'DI', description: 'Fault/Torque Trip Alarm' },
      { tag: 'MO-XXX', signalType: 'DO', description: 'Open Command' },
      { tag: 'MC-XXX', signalType: 'DO', description: 'Close Command' },
    ],
  },
  {
    id: 'control-valve',
    name: 'Control Valve',
    category: 'Valves',
    description: 'Modulating control valve with positioner',
    ioPoints: [
      { tag: 'ZI-XXX', signalType: 'AI', description: 'Valve Position Feedback' },
      { tag: 'ZSO-XXX', signalType: 'DI', description: 'Valve Full Open' },
      { tag: 'ZSC-XXX', signalType: 'DI', description: 'Valve Full Closed' },
      { tag: 'FV-XXX', signalType: 'AO', description: 'Valve Position Output' },
    ],
  },
  {
    id: 'solenoid-valve',
    name: 'Solenoid Valve (SOV)',
    category: 'Valves',
    description: 'On/Off solenoid valve',
    ioPoints: [
      { tag: 'ZSO-XXX', signalType: 'DI', description: 'Valve Position Open' },
      { tag: 'ZSC-XXX', signalType: 'DI', description: 'Valve Position Closed' },
      { tag: 'XV-XXX', signalType: 'DO', description: 'Solenoid Command' },
    ],
  },
  {
    id: 'level-transmitter',
    name: 'Level Transmitter',
    category: 'Instruments',
    description: 'Level measurement with alarms',
    ioPoints: [
      { tag: 'LIT-XXX', signalType: 'AI', description: 'Level Transmitter' },
      { tag: 'LSHH-XXX', signalType: 'DI', description: 'Level Switch High High' },
      { tag: 'LSH-XXX', signalType: 'DI', description: 'Level Switch High' },
      { tag: 'LSL-XXX', signalType: 'DI', description: 'Level Switch Low' },
      { tag: 'LSLL-XXX', signalType: 'DI', description: 'Level Switch Low Low' },
    ],
  },
  {
    id: 'pressure-transmitter',
    name: 'Pressure Transmitter',
    category: 'Instruments',
    description: 'Pressure measurement with alarms',
    ioPoints: [
      { tag: 'PIT-XXX', signalType: 'AI', description: 'Pressure Transmitter' },
      { tag: 'PSHH-XXX', signalType: 'DI', description: 'Pressure Switch High High' },
      { tag: 'PSH-XXX', signalType: 'DI', description: 'Pressure Switch High' },
      { tag: 'PSL-XXX', signalType: 'DI', description: 'Pressure Switch Low' },
      { tag: 'PSLL-XXX', signalType: 'DI', description: 'Pressure Switch Low Low' },
    ],
  },
  {
    id: 'flow-transmitter',
    name: 'Flow Transmitter',
    category: 'Instruments',
    description: 'Flow measurement with totalizer',
    ioPoints: [
      { tag: 'FIT-XXX', signalType: 'AI', description: 'Flow Transmitter' },
      { tag: 'FQI-XXX', signalType: 'AI', description: 'Flow Totalizer' },
      { tag: 'FSH-XXX', signalType: 'DI', description: 'Flow Switch High' },
      { tag: 'FSL-XXX', signalType: 'DI', description: 'Flow Switch Low' },
    ],
  },
  {
    id: 'exhaust-fan',
    name: 'Exhaust Fan',
    category: 'HVAC',
    description: 'Ventilation exhaust fan',
    ioPoints: [
      { tag: 'HS-XXX', signalType: 'DI', description: 'Manual/Off/Auto Switch' },
      { tag: 'HSR-XXX', signalType: 'DI', description: 'Start Pushbutton' },
      { tag: 'HSS-XXX', signalType: 'DI', description: 'Stop Pushbutton' },
      { tag: 'YI-XXX', signalType: 'DI', description: 'Running Status' },
      { tag: 'YA-XXX', signalType: 'DI', description: 'Fault Alarm' },
      { tag: 'HA-XXX', signalType: 'DI', description: 'Manual Mode Alarm' },
      { tag: 'M-XXX', signalType: 'DO', description: 'Motor Start Command' },
    ],
  },
  {
    id: 'flood-detection',
    name: 'Flood Detection',
    category: 'Safety',
    description: 'Flood detection switch with alarms',
    ioPoints: [
      { tag: 'LS-XXX', signalType: 'DI', description: 'Flood Switch' },
      { tag: 'LAH-XXX', signalType: 'DI', description: 'Flood Alarm High' },
      { tag: 'LAHH-XXX', signalType: 'DI', description: 'Flood Alarm High High' },
    ],
  },
];

export default function EquipmentTemplatesPage() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState(DEFAULT_TEMPLATES);
  const [expandedTemplates, setExpandedTemplates] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Get unique categories
  const categories = ['All', ...new Set(templates.map(t => t.category))];

  // Filter templates by category
  const filteredTemplates = selectedCategory === 'All'
    ? templates
    : templates.filter(t => t.category === selectedCategory);

  const toggleExpand = (id) => {
    setExpandedTemplates(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getSignalTypeBadgeColor = (type) => {
    const colors = {
      AI: 'bg-blue-100 text-blue-700 border-blue-300',
      DI: 'bg-green-100 text-green-700 border-green-300',
      DO: 'bg-orange-100 text-orange-700 border-orange-300',
      AO: 'bg-purple-100 text-purple-700 border-purple-300',
    };
    return colors[type] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  const countByType = (ioPoints) => {
    const counts = { AI: 0, DI: 0, DO: 0, AO: 0 };
    ioPoints.forEach(io => {
      if (counts[io.signalType] !== undefined) {
        counts[io.signalType]++;
      }
    });
    return counts;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />

      <main className="flex-1 px-4 py-20">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:text-indigo-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back to Home</span>
              </button>
            </div>
          </div>

          {/* Title Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-600 to-cyan-500 rounded-2xl mb-4 shadow-lg">
              <Package className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Equipment I/O Templates</h1>
            <p className="text-slate-600">
              Reference guide for standard I/O points per equipment type
            </p>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === category
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-slate-700 hover:bg-indigo-50 border border-slate-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Templates Grid */}
          <div className="space-y-4">
            {filteredTemplates.map(template => {
              const isExpanded = expandedTemplates[template.id];
              const counts = countByType(template.ioPoints);

              return (
                <div
                  key={template.id}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden"
                >
                  {/* Template Header */}
                  <button
                    onClick={() => toggleExpand(template.id)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-indigo-100 rounded-lg">
                        <Cpu className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-slate-900">{template.name}</h3>
                        <p className="text-sm text-slate-600">{template.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {/* I/O Counts */}
                      <div className="hidden md:flex items-center gap-2">
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                          AI: {counts.AI}
                        </span>
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded">
                          DI: {counts.DI}
                        </span>
                        <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-700 rounded">
                          DO: {counts.DO}
                        </span>
                        <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded">
                          AO: {counts.AO}
                        </span>
                      </div>
                      <span className="px-3 py-1 text-sm bg-slate-100 text-slate-600 rounded-full">
                        {template.ioPoints.length} points
                      </span>
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {/* Expanded I/O Points */}
                  {isExpanded && (
                    <div className="border-t border-slate-200">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                                Tag Pattern
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                                Signal Type
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                                Description
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {template.ioPoints.map((io, index) => (
                              <tr key={index} className="hover:bg-slate-50">
                                <td className="px-6 py-3 font-mono text-sm text-slate-900">
                                  {io.tag}
                                </td>
                                <td className="px-6 py-3">
                                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getSignalTypeBadgeColor(io.signalType)}`}>
                                    {io.signalType}
                                  </span>
                                </td>
                                <td className="px-6 py-3 text-sm text-slate-700">
                                  {io.description}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Summary Footer */}
                      <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
                        <div className="flex flex-wrap gap-4 text-sm">
                          <span className="text-slate-600">
                            <strong className="text-blue-700">AI:</strong> {counts.AI}
                          </span>
                          <span className="text-slate-600">
                            <strong className="text-green-700">DI:</strong> {counts.DI}
                          </span>
                          <span className="text-slate-600">
                            <strong className="text-orange-700">DO:</strong> {counts.DO}
                          </span>
                          <span className="text-slate-600">
                            <strong className="text-purple-700">AO:</strong> {counts.AO}
                          </span>
                          <span className="text-slate-900 font-medium ml-auto">
                            Total: {template.ioPoints.length} I/O points
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend Section */}
          <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Signal Type Legend</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="font-bold text-blue-700 mb-1">AI - Analog Input</div>
                <p className="text-sm text-blue-600">
                  Continuous measurements from field devices (4-20mA, 0-10V)
                </p>
                <p className="text-xs text-blue-500 mt-2">
                  Examples: LIT, PIT, FIT, TIT, Feedback signals
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="font-bold text-green-700 mb-1">DI - Digital Input</div>
                <p className="text-sm text-green-600">
                  Discrete on/off signals from field devices
                </p>
                <p className="text-xs text-green-500 mt-2">
                  Examples: LSH, PSL, ZSO, ZSC, YI, YA, HS
                </p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="font-bold text-orange-700 mb-1">DO - Digital Output</div>
                <p className="text-sm text-orange-600">
                  Discrete on/off commands to field devices
                </p>
                <p className="text-xs text-orange-500 mt-2">
                  Examples: XV, Motor Start/Stop, Alarms
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="font-bold text-purple-700 mb-1">AO - Analog Output</div>
                <p className="text-sm text-purple-600">
                  Continuous control signals to field devices
                </p>
                <p className="text-xs text-purple-500 mt-2">
                  Examples: FV, VFD Speed, Positioners
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
