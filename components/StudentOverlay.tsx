'use client';

import React from 'react';
import { useData } from '@/context/DataContext';
import { X, Mail, Phone, Calendar, Star, MapPin } from 'lucide-react';

interface StudentOverlayProps {
  studentId: string;
  onClose: () => void;
}

export default function StudentOverlay({ studentId, onClose }: StudentOverlayProps) {
  const { students } = useData();
  const student = students.find(s => s.profile.unique_id === studentId);

  if (!student) return null;

  return (
    <>
      {/* Background Blur Overlay within Main Workspace */}
      <div 
        className="absolute inset-0 z-40 overlay-backdrop animate-in fade-in duration-200" 
        onClick={onClose}
      />

      {/* Floating Detail Card */}
      <div className="absolute top-0 right-0 h-full w-[440px] bg-white shadow-2xl z-50 flex flex-col border-l border-border-color animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-border-color bg-white relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-transparent text-text-muted hover:bg-gray-100 rounded-full"
          >
            <X size={20} />
          </button>
          
          <div className="flex gap-4 items-center">
            <div className="w-20 h-20 rounded-2xl bg-gray-200 overflow-hidden shadow-sm flex-shrink-0">
              <img 
                src={`https://api.dicebear.com/7.x/initials/svg?seed=${student.profile.name}&backgroundColor=E5E7EB&textColor=1E3A8A`} 
                alt={student.profile.name} 
                className="w-full h-full object-cover" 
              />
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-2xl font-bold leading-tight">{student.profile.name}</h2>
              <div className="flex items-center gap-1 text-xs text-text-muted mt-1">
                <MapPin size={12} /> {student.profile.school}
              </div>
              <div className="flex items-center gap-1 text-xs text-text-muted">
                <Calendar size={12} /> {student.profile.dob} ({student.profile.age} yrs)
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8 bg-background">
          
          {/* Reason/Notes Block */}
          <div className="bg-[#F3F4F6] rounded-xl p-5 border border-border-color">
            <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-3">Rider Background</h3>
            <p className="text-sm text-text leading-relaxed font-medium">
              Primary Objective is <strong>{student.background_questionnaire.objective}</strong>. 
              {student.background_questionnaire.events_attended ? " Has attended previous events." : " First time at a formalized event."} 
              Currently holds {student.background_questionnaire.medals_won} medals.
            </p>
          </div>

          {/* Tagging System */}
          <div>
            <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-3">Target Categories</h3>
            <div className="flex flex-wrap gap-2">
              <span className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-xs font-bold">Dress Code</span>
              <span className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-xs font-bold">Tack Identification</span>
              <span className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-xs font-bold">Riding Knowledge</span>
            </div>
          </div>

          {/* Timeline Logic */}
          <div>
            <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-4">Progression Path</h3>
            <div className="flex flex-col gap-0 relative pl-4">
              {/* Connecting Line */}
              <div className="absolute left-[21px] top-4 bottom-8 w-0.5 bg-border-color z-0"></div>
              
              {(student.progression.levels || [1, 2, 3, 4].filter(() => false)).concat(
                [1, 2, 3, 4].filter(l => !(student.progression.levels || []).includes(l))
              ).sort().map((level) => {
                const isActive = (student.progression.levels || []).includes(level);
                const isPassed = false; // Could be computed from exams data
                
                return (
                  <div key={level} className="flex gap-4 relative z-10 opacity-100">
                    <div className="flex flex-col items-center pt-1">
                      <div className={`w-3 h-3 rounded-full border-2 ${
                        isPassed ? 'bg-success border-success' : 
                        isActive ? 'bg-white border-primary shadow-[0_0_0_4px_rgba(30,58,138,0.1)]' : 
                        'bg-white border-border-color'
                      }`} />
                    </div>
                    <div className="pb-8">
                      <h4 className={`text-sm font-bold ${isActive ? 'text-primary' : isPassed ? 'text-text' : 'text-text-muted'}`}>
                        Level {level} Evaluation
                      </h4>
                      {isPassed && <p className="text-xs text-text-muted mt-1">Completed successfully</p>}
                      {isActive && <p className="text-xs font-semibold text-primary mt-1">Ready for scheduling</p>}
                      {!isPassed && !isActive && <p className="text-xs text-text-muted mt-1">Locked</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-5 border-t border-border-color bg-white flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 bg-white text-text border border-border-color hover:bg-gray-50 focus-visible:outline-none"
          >
            Close Viewer
          </button>
          <button className="flex-1 bg-primary text-white shadow-md shadow-primary/20 focus-visible:outline-none">
            Schedule Exam
          </button>
        </div>

      </div>
    </>
  );
}
