import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Upload,
  Download,
  Filter,
  ArrowRight,
  Edit,
  Trash2,
  GraduationCap,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { Student, ClassArm, Subject } from '../../types';
import { StudentFormModal } from './StudentFormModal';
import { CsvStudentImportModal } from './CsvStudentImportModal';
import { PromotionModal } from './PromotionModal';

interface StudentListProps {
  students: Student[];
  classArms: ClassArm[];
  subjects: Subject[];
  currentSession: string;
  onSaveStudent: (student: Student) => Promise<void>;
  onDeleteStudent: (id: string) => Promise<void>;
  onBulkImport: (students: Student[]) => Promise<void>;
  onPromoteStudents: (studentIds: string[], targetArmId: string, nextSession: string) => Promise<void>;
  onViewStudentProfile: (student: Student) => void;
}

export const StudentList: React.FC<StudentListProps> = ({
  students,
  classArms,
  subjects,
  currentSession,
  onSaveStudent,
  onDeleteStudent,
  onBulkImport,
  onPromoteStudents,
  onViewStudentProfile,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArmId, setSelectedArmId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isPromotionOpen, setIsPromotionOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.parentName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesArm = selectedArmId === 'all' || s.currentArmId === selectedArmId;
    const matchesStatus = selectedStatus === 'all' || s.status === selectedStatus;
    return matchesSearch && matchesArm && matchesStatus;
  });

  const handleExportCsv = () => {
    const headers = 'AdmissionNumber,FullName,Gender,DOB,ClassArm,Session,ParentName,ParentPhone,Status\n';
    const rows = filteredStudents
      .map((s) => {
        const arm = classArms.find((a) => a.id === s.currentArmId);
        return `"${s.admissionNumber}","${s.fullName}","${s.gender}","${s.dob}","${arm?.name || ''}","${s.currentSession}","${s.parentName}","${s.parentPhone}","${s.status}"`;
      })
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sams_students_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
            <Users className="w-6 h-6 text-emerald-700" />
            <span>Student Information Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage student registrations, biometric details, class placement, and academic progression
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsPromotionOpen(true)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 flex items-center space-x-1.5 transition-colors shadow-2xs"
          >
            <ArrowRight className="w-3.5 h-3.5 text-amber-700" />
            <span>Promote Class</span>
          </button>
          <button
            onClick={() => setIsImportOpen(true)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 flex items-center space-x-1.5 transition-colors shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import CSV</span>
          </button>
          <button
            onClick={handleExportCsv}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 flex items-center space-x-1.5 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
          <button
            onClick={() => {
              setEditingStudent(null);
              setIsFormOpen(true);
            }}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white flex items-center space-x-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Register Student</span>
          </button>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search student by Name, Admission Number, or Guardian..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-hidden"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <select
            value={selectedArmId}
            onChange={(e) => setSelectedArmId(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white outline-hidden font-medium text-slate-700"
          >
            <option value="all">All Class Arms</option>
            {classArms.map((arm) => (
              <option key={arm.id} value={arm.id}>
                {arm.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white outline-hidden font-medium text-slate-700"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="graduated">Graduated</option>
            <option value="transferred">Transferred</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Admission No.</th>
                <th className="py-3 px-4">Class Arm</th>
                <th className="py-3 px-4">Gender</th>
                <th className="py-3 px-4">Parent / Guardian</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((std) => {
                  const arm = classArms.find((a) => a.id === std.currentArmId);
                  return (
                    <tr key={std.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                            {std.fullName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{std.fullName}</p>
                            <p className="text-[10px] text-slate-400">DOB: {std.dob}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                        {std.admissionNumber}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">
                        {arm?.name || std.currentClassId.toUpperCase()}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{std.gender}</td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-800">{std.parentName}</p>
                        <p className="text-[10px] text-slate-400">{std.parentPhone}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            std.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {std.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => onViewStudentProfile(std)}
                            title="View Academic Record"
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingStudent(std);
                              setIsFormOpen(true);
                            }}
                            title="Edit Profile"
                            className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete ${std.fullName}?`)) {
                                onDeleteStudent(std.id);
                              }
                            }}
                            title="Delete Record"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No students found matching your search and filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <StudentFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={onSaveStudent}
        initialStudent={editingStudent}
        classArms={classArms}
        subjects={subjects}
        currentSession={currentSession}
      />

      <CsvStudentImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImport={onBulkImport}
        classArms={classArms}
        subjects={subjects}
        currentSession={currentSession}
      />

      <PromotionModal
        isOpen={isPromotionOpen}
        onClose={() => setIsPromotionOpen(false)}
        students={students}
        classArms={classArms}
        currentSession={currentSession}
        onPromote={onPromoteStudents}
      />
    </div>
  );
};
