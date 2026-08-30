'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Header } from '../../../components/Header';
import { OfflineBanner } from '../../../components/OfflineBanner';
import { Card, Input, Button, StatusBadge, Modal } from '@vargani/ui';
import { apiRequest } from '../../../lib/api-client';
import { getT } from '../../../lib/i18n';
import { Role, MemberStatus } from '@vargani/types';
import Link from 'next/link';
import { UserPlus, Users, Phone, UserCheck } from 'lucide-react';

export default function MembersPage() {
  const { activeMandal, role, token, language } = useAuth();
  const t = getT(language);

  const [members, setMembers] = useState<any[]>([]);
  const [, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Invite Form
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role>(Role.VOLUNTEER);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = () => {
    if (activeMandal && token) {
      apiRequest<any[]>('/members')
        .then(setMembers)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [activeMandal, token]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError('कृपया वैध १० अंकी मोबाईल नंबर टाका');
      return;
    }
    if (!fullName.trim()) {
      setError('नाव आवश्यक आहे');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await apiRequest('/members/invite', {
        method: 'POST',
        body: JSON.stringify({
          phone: phone.trim(),
          full_name: fullName.trim(),
          role: selectedRole,
        }),
      });

      setIsModalOpen(false);
      setPhone('');
      setFullName('');
      fetchMembers();
    } catch (err: any) {
      setError(err.message || 'सदस्य जोडण्यात त्रुटी आली');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (memberId: string, currentStatus: MemberStatus) => {
    const newStatus = currentStatus === MemberStatus.ACTIVE ? MemberStatus.REVOKED : MemberStatus.ACTIVE;
    try {
      await apiRequest(`/members/${memberId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      fetchMembers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] pb-16">
      <Header />
      <OfflineBanner />

      {/* Nav */}
      <div className="bg-white border-b border-[#E5E1D8] px-4 py-2">
        <div className="max-w-5xl mx-auto flex items-center gap-2 overflow-x-auto text-xs font-semibold">
          <Link href="/dashboard" className="px-3 py-1.5 rounded-lg text-[#6B6459] hover:bg-[#F3F1EC]">
            {t.dashboard}
          </Link>
          <Link href="/reconciliation" className="px-3 py-1.5 rounded-lg text-[#6B6459] hover:bg-[#F3F1EC]">
            {t.reconciliation}
          </Link>
          <Link href="/expenses" className="px-3 py-1.5 rounded-lg text-[#6B6459] hover:bg-[#F3F1EC]">
            {t.expenses}
          </Link>
          <Link href="/members" className="px-3 py-1.5 rounded-lg bg-orange-50 text-[#F97316] font-bold border border-orange-200">
            {t.members}
          </Link>
          <Link href="/reports" className="px-3 py-1.5 rounded-lg text-[#6B6459] hover:bg-[#F3F1EC]">
            {t.reports}
          </Link>
          {role === Role.ADMIN && (
            <Link href="/settings" className="px-3 py-1.5 rounded-lg text-[#6B6459] hover:bg-[#F3F1EC]">
              {t.settings}
            </Link>
          )}
        </div>
      </div>

      <main className="max-w-5xl mx-auto w-full px-4 pt-6 flex-1 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold text-[#292118]">{t.members} (Mandal Team)</h2>
            <p className="text-xs text-[#6B6459] mt-0.5">
              मंडळातील कार्यकर्ते, खजिनदार आणि व्यवस्थापक यांचे अधिकार व पावती पुस्तक वाटप.
            </p>
          </div>

          {role === Role.ADMIN && (
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsModalOpen(true)}
              className="font-bold gap-1.5 self-start"
            >
              <UserPlus className="w-4 h-4" />
              <span>नवीन कार्यकर्ता जोडा</span>
            </Button>
          )}
        </div>

        {/* Members Table */}
        <Card variant="default" padding="none" className="shadow-sm overflow-hidden">
          <div className="p-4 border-b border-[#E5E1D8] flex items-center justify-between">
            <h3 className="text-base font-bold text-[#292118] flex items-center gap-2">
              <Users className="w-4 h-4 text-[#F97316]" />
              <span>सक्रिय सभासद व कार्यकर्ते ({members.length})</span>
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#F3F1EC] text-[#6B6459] font-bold text-xs uppercase border-b border-[#E5E1D8]">
                <tr>
                  <th className="px-4 py-3">नाव (Name)</th>
                  <th className="px-4 py-3">मोबाईल</th>
                  <th className="px-4 py-3">भूमिका (Role)</th>
                  <th className="px-4 py-3">पावती पुस्तक ब्लॉक</th>
                  <th className="px-4 py-3 text-center">स्थिती (Status)</th>
                  {role === Role.ADMIN && <th className="px-4 py-3 text-center">सक्रिय / निष्क्रिय</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E1D8]">
                {members.map((m) => (
                  <tr key={m.id} className="hover:bg-orange-50/20 transition">
                    <td className="px-4 py-3 font-semibold text-[#292118]">{m.full_name}</td>
                    <td className="px-4 py-3 text-[#6B6459]">{m.phone}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        m.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                        m.role === 'TREASURER' ? 'bg-blue-100 text-blue-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {m.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#6B6459]">
                      {m.range_start ? (
                        <span>
                          क्र. {m.range_start} ते {m.range_end} (चालू: {m.current_number})
                        </span>
                      ) : (
                        <span>—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {m.status === MemberStatus.ACTIVE ? (
                        <StatusBadge status="success" label="Active" size="sm" />
                      ) : (
                        <StatusBadge status="neutral" label="Revoked" size="sm" />
                      )}
                    </td>
                    {role === Role.ADMIN && (
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleToggleStatus(m.id, m.status)}
                          className={`text-xs font-bold px-2.5 py-1 rounded transition ${
                            m.status === MemberStatus.ACTIVE
                              ? 'text-red-600 hover:bg-red-50'
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          {m.status === MemberStatus.ACTIVE ? 'बंद करा (Deactivate)' : 'सक्रिय करा'}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </main>

      {/* Invite Member Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="नवीन कार्यकर्ता जोडा">
        <form onSubmit={handleInvite} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          <Input
            label="कार्यकर्त्याचे पूर्ण नाव"
            placeholder="उदा. राहुल जाधव"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            leftIcon={<UserCheck className="w-4 h-4" />}
            required
          />

          <Input
            label="मोबाईल नंबर (१० अंकी)"
            type="tel"
            maxLength={10}
            placeholder="उदा. 9822012345"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
            leftIcon={<Phone className="w-4 h-4" />}
            required
          />

          <div className="space-y-1 text-left">
            <label className="text-sm font-medium text-[#292118]">भूमिका (Role)</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as Role)}
              className="w-full min-h-[48px] rounded-xl border-2 border-[#E5E1D8] bg-white px-3.5 text-base text-[#292118] focus:border-[#F97316] focus:outline-none"
            >
              <option value={Role.VOLUNTEER}>कार्यकर्ता (Volunteer) - वर्गणी नोंदणी</option>
              <option value={Role.TREASURER}>खजिनदार (Treasurer) - हिशोब व पडताळणी</option>
              <option value={Role.ADMIN}>अध्यक्ष / Admin - पूर्ण नियंत्रण</option>
            </select>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isSubmitting}
              className="font-bold"
            >
              <span>कार्यकर्ता समाविष्ट करा</span>
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
