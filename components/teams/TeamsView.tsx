'use client';

import React, { useState } from 'react';
import {
  MOCK_TEAMS,
  MOCK_TEAM_MEMBERS,
  TeamMember,
} from '@/lib/mock-data';
import { RoleBadge } from '@/components/ui/Badge';
import {
  PlusIcon,
  CheckCircleIcon,
  SearchIcon,
  XIcon,
} from '@/components/ui/Icons';

export function TeamsView() {
  const [members, setMembers] = useState<TeamMember[]>(MOCK_TEAM_MEMBERS);
  const [selectedTeamFilter, setSelectedTeamFilter] = useState('all');
  const [teams, setTeams] = useState(MOCK_TEAMS);
  const [memberSearch, setMemberSearch] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  // Modal placeholders
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isManageTeamOpen, setIsManageTeamOpen] = useState(false);

  // New member form state
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberTeam, setNewMemberTeam] = useState('Platform Ops');
  const [newMemberRole, setNewMemberRole] = useState<'Admin' | 'Manager' | 'Member'>('Member');

  React.useEffect(() => {
    Promise.all([
      fetch('/api/teams').then((r) => r.json()).catch(() => null),
      fetch('/api/members').then((r) => r.json()).catch(() => null),
    ]).then(([teamsData, membersData]) => {
      if (teamsData?.teams) setTeams(teamsData.teams);
      if (membersData?.members) setMembers(membersData.members);
    });
  }, []);

  const filteredMembers = members.filter((member) => {
    if (selectedTeamFilter !== 'all' && member.team !== selectedTeamFilter) {
      return false;
    }
    if (memberSearch.trim()) {
      const q = memberSearch.toLowerCase();
      return (
        member.name.toLowerCase().includes(q) ||
        member.email.toLowerCase().includes(q) ||
        member.team.toLowerCase().includes(q) ||
        member.role.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleAddMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim() || !newMemberEmail.trim()) {
      return;
    }

    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newMemberName.trim(),
          email: newMemberEmail.trim(),
          team: newMemberTeam,
          role: newMemberRole,
        }),
      });
      const data = await res.json();
      if (res.ok && data.member) {
        setMembers([data.member, ...members]);
        setFeedback(`Added operator "${data.member.name}" to ${data.member.team}.`);
      } else {
        throw new Error(data.error);
      }
    } catch {
      const newMember: TeamMember = {
        id: `usr-${Date.now()}`,
        name: newMemberName.trim(),
        email: newMemberEmail.trim(),
        team: newMemberTeam,
        role: newMemberRole,
        status: 'Active',
        avatarInitials: newMemberName
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2),
      };
      setMembers([newMember, ...members]);
      setFeedback(`Added member "${newMember.name}" to ${newMember.team} (Client mode).`);
    }

    setIsAddMemberOpen(false);
    setNewMemberName('');
    setNewMemberEmail('');
    setTimeout(() => setFeedback(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Teams & Members
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Organize operational units, manage team leads, and configure access permissions.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsManageTeamOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
          >
            <span>Manage Teams</span>
          </button>
          <button
            type="button"
            onClick={() => setIsAddMemberOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Add Member</span>
          </button>
        </div>
      </div>

      {/* Action Notification Toast */}
      {feedback && (
        <div className="flex items-center justify-between rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedback}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-emerald-700 hover:text-emerald-900 font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Teams Overview Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Operational Teams ({teams.length})
          </h3>
          {selectedTeamFilter !== 'all' && (
            <button
              onClick={() => setSelectedTeamFilter('all')}
              className="text-xs text-blue-600 hover:underline"
            >
              Clear team filter
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => {
            const isSelected = selectedTeamFilter === team.name;
            return (
              <div
                key={team.id}
                onClick={() => setSelectedTeamFilter(isSelected ? 'all' : team.name)}
                className={`cursor-pointer rounded-lg border bg-white p-4 transition-all duration-150 ${
                  isSelected
                    ? 'border-blue-500 ring-1 ring-blue-500 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-900">{team.name}</h4>
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-mono text-slate-600">
                    {team.memberCount} members
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                  {team.description}
                </p>
                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                  <span>Lead: <strong className="text-slate-700 font-medium">{team.lead}</strong></span>
                  <span className="text-slate-400">{team.openItemsCount} active tasks</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Members Section */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 p-4 bg-slate-50/50">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Team Members</h3>
            <p className="text-xs text-slate-500">
              Showing {filteredMembers.length} active operators
              {selectedTeamFilter !== 'all' ? ` in ${selectedTeamFilter}` : ''}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400">
                <SearchIcon className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="Search member, email, role..."
                className="w-full sm:w-60 rounded-md border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Member Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
              <tr>
                <th scope="col" className="px-5 py-3">Member</th>
                <th scope="col" className="px-4 py-3">Email</th>
                <th scope="col" className="px-4 py-3">Assigned Team</th>
                <th scope="col" className="px-4 py-3">Role</th>
                <th scope="col" className="px-4 py-3">Status</th>
                <th scope="col" className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-[11px] font-semibold text-slate-700">
                        {member.avatarInitials}
                      </div>
                      <span className="font-medium text-slate-900">{member.name}</span>
                    </div>
                  </td>

                  <td className="px-4 py-3.5 whitespace-nowrap font-mono text-[11px] text-slate-600">
                    {member.email}
                  </td>

                  <td className="px-4 py-3.5 whitespace-nowrap text-slate-700">
                    {member.team}
                  </td>

                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <RoleBadge role={member.role} />
                  </td>

                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        member.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          member.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'
                        }`}
                      />
                      {member.status}
                    </span>
                  </td>

                  <td className="px-4 py-3.5 whitespace-nowrap text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setFeedback(`Editing permissions for ${member.name} (UI placeholder).`);
                        setTimeout(() => setFeedback(null), 3000);
                      }}
                      className="text-xs font-medium text-slate-500 hover:text-blue-600"
                    >
                      Configure
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Member Modal UI Placeholder */}
      {isAddMemberOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-base font-bold text-slate-900">Add Team Member</h4>
              <button
                type="button"
                onClick={() => setIsAddMemberOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMemberSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="e.g. Jordan Blake"
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-xs sm:text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Work Email</label>
                <input
                  type="email"
                  required
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder="jordan.blake@newtonite.internal"
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-xs sm:text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Team</label>
                  <select
                    value={newMemberTeam}
                    onChange={(e) => setNewMemberTeam(e.target.value)}
                    className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                  >
                    {MOCK_TEAMS.map((t) => (
                      <option key={t.id} value={t.name}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
                  <select
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value as 'Admin' | 'Manager' | 'Member')}
                    className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="Member">Member</option>
                    <option value="Manager">Manager</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddMemberOpen(false)}
                  className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  Add Member (UI)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Team Modal UI Placeholder */}
      {isManageTeamOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-base font-bold text-slate-900">Manage Operational Units</h4>
              <button
                type="button"
                onClick={() => setIsManageTeamOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-4 space-y-3 text-xs text-slate-600">
              <p>Team policies, default SLA thresholds, and escalation pathways:</p>
              <div className="rounded border border-slate-200 divide-y divide-slate-100">
                {MOCK_TEAMS.map((t) => (
                  <div key={t.id} className="p-2.5 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-800">{t.name}</p>
                      <p className="text-[11px] text-slate-400">Lead: {t.lead}</p>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500">
                      {t.openItemsCount} active tasks
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setIsManageTeamOpen(false)}
                className="rounded-md bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
