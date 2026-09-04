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
import { UserPlus, Users, Phone, UserCheck, Share2, Copy, Check, Lock, ExternalLink, Shield } from 'lucide-react';

interface CreatedCredentials {
  user: {
    id: string;
    username: string;
    full_name: string;
    phone?: string | null;
  };
  defaultPassword: string;
  loginUrl: string;
  shareableMessage: string;
}

export default function MembersPage() {
  const { activeMandal, role, token, language } = useAuth();
  const t = getT(language);

  const [members, setMembers] = useState<any[]>([]);
  const [, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Invite Form
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role>(Role.VOLUNTEER);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Post-Creation Share Modal
  const [credentialsModal, setCredentialsModal] = useState<CreatedCredentials | null>(null);
  const [copied, setCopied] = useState(false);

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

  const handleNameChange = (val: string) => {
    setFullName(val);
    if (!username || username === autoSlug(fullName)) {
      setUsername(autoSlug(val));
    }
  };

  const autoSlug = (str: string) => {
    return str
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/gi, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('नाव आवश्यक आहे');
      return;
    }
    if (phone && !/^[6-9]\d{9}$/.test(phone.trim())) {
      setError('कृपया वैध १० अंकी मोबाईल नंबर टाका');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      const res = await apiRequest<any>('/members/invite', {
        method: 'POST',
        body: JSON.stringify({
          full_name: fullName.trim(),
          username: username.trim() || undefined,
          phone: phone.trim() || undefined,
          role: selectedRole,
        }),
      });

      setIsModalOpen(false);
      setFullName('');
      setUsername('');
      setPhone('');
      fetchMembers();

      // Open credentials sharing popup
      if (res && res.user) {
        setCredentialsModal({
          user: res.user,
          defaultPassword: res.defaultPassword || 'user123',
          loginUrl: res.loginUrl || 'https://digital-vargani-mu.vercel.app/login',
          shareableMessage: res.shareableMessage,
        });
      }
    } catch (err: any) {
      setError(err.message || 'सदस्य जोडण्यात त्रुटी आली');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShareWhatsApp = (message: string, memberPhone?: string | null) => {
    const phoneNum = memberPhone ? `91${memberPhone.replace(/\D/g, '')}` : '';
    const url = phoneNum
      ? `https://api.whatsapp.com/send?phone=${phoneNum}&text=${encodeURIComponent(message)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleCopyCredentials = (message: string) => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenExistingShare = (m: any) => {
    const mandalName = activeMandal?.name || 'मंडळ';
    const loginUrl = 'https://digital-vargani-mu.vercel.app/login';
    const message = `🚩 *${mandalName} - डिजिटल वर्गणी लॉगिन माहिती*\n\nनमस्कार ${m.full_name},\nआपणांस डिजिटल वर्गणी प्रणालीमध्ये *${m.role}* म्हणून समाविष्ट करण्यात आले आहे.\n\n🔗 *लॉगिन लिंक:* ${loginUrl}\n👤 *युझरनेम (Username):* ${m.username || m.phone || m.full_name}\n🔑 *डिफॉल्ट पासवर्ड:* user123\n\n⚠️ पहिल्या लॉगिननंतर कृपया आपला पासवर्ड बदलून घ्या.`;

    setCredentialsModal({
      user: {
        id: m.user_id,
        username: m.username || m.phone || m.full_name,
        full_name: m.full_name,
        phone: m.phone,
      },
      defaultPassword: 'user123',
      loginUrl,
      shareableMessage: message,
    });
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
              मंडळातील कार्यकर्ते, खजिनदार आणि व्यवस्थापक यांचे अधिकार, युझरनेम व पावती पुस्तक वाटप.
            </p>
          </div>

          {role === Role.ADMIN && (
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsModalOpen(true)}
              className="font-bold gap-1.5 self-start shadow-md shadow-orange-500/20"
            >
              <UserPlus className="w-4 h-4" />
              <span>नवीन कार्यकर्ता जोडा (Add User)</span>
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
                  <th className="px-4 py-3">युझरनेम (Username)</th>
                  <th className="px-4 py-3">मोबाईल</th>
                  <th className="px-4 py-3">भूमिका (Role)</th>
                  <th className="px-4 py-3">पावती पुस्तक ब्लॉक</th>
                  <th className="px-4 py-3 text-center">स्थिती (Status)</th>
                  {role === Role.ADMIN && <th className="px-4 py-3 text-center">लॉगिन शेअर</th>}
                  {role === Role.ADMIN && <th className="px-4 py-3 text-center">अधिकार</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E1D8]">
                {members.map((m) => (
                  <tr key={m.id} className="hover:bg-orange-50/20 transition">
                    <td className="px-4 py-3 font-semibold text-[#292118]">{m.full_name}</td>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-[#C2410C]">
                      {m.username || '—'}
                    </td>
                    <td className="px-4 py-3 text-[#6B6459]">{m.phone || '—'}</td>
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
                          onClick={() => handleOpenExistingShare(m)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#C2410C] bg-orange-50 hover:bg-orange-100 border border-orange-200 px-2.5 py-1 rounded-lg transition"
                          title="लॉगिन तपशील शेअर करा"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>शेअर</span>
                        </button>
                      </td>
                    )}
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

      {/* Invite / Add Member Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="नवीन युझर / कार्यकर्ता जोडा">
        <form onSubmit={handleInvite} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl text-xs text-orange-900 flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-[#F97316] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">स्वयंचलित डिफॉल्ट पासवर्ड</p>
              <p className="text-orange-800 mt-0.5">
                नवीन युझरसाठी <strong>user123</strong> हा डिफॉल्ट पासवर्ड आपोआप सेट होईल. नवीन युझरला पहिल्या लॉगिननंतर पासवर्ड बदलण्याची सूचना दिली जाईल.
              </p>
            </div>
          </div>

          <Input
            label="कार्यकर्त्याचे पूर्ण नाव"
            placeholder="उदा. राहुल जाधव"
            value={fullName}
            onChange={(e) => handleNameChange(e.target.value)}
            leftIcon={<UserCheck className="w-4 h-4" />}
            required
          />

          <Input
            label="युझरनेम (Username)"
            placeholder="उदा. rahul_jadhav"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
            leftIcon={<span className="text-xs font-bold text-[#8C827A]">@</span>}
            required
          />

          <Input
            label="मोबाईल नंबर (ऐच्छिक - व्हॉट्सॲपसाठी)"
            type="tel"
            maxLength={10}
            placeholder="उदा. 9822012345 (ऐच्छिक)"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
            leftIcon={<Phone className="w-4 h-4" />}
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
              className="font-bold shadow-md shadow-orange-500/20"
            >
              <span>कार्यकर्ता जोडा व लॉगिन तयार करा</span>
            </Button>
          </div>
        </form>
      </Modal>

      {/* Post-Creation & Share Credentials Modal */}
      {credentialsModal && (
        <Modal
          isOpen={true}
          onClose={() => setCredentialsModal(null)}
          title="लॉगिन तपशील व शेअरिंग (User Credentials)"
        >
          <div className="space-y-4">
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2.5">
              <Shield className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-900">युझर यशस्वीरीत्या तयार झाला!</p>
                <p className="mt-0.5">
                  खालील युझरनेम व पासवर्ड संबंधितांना पाठवा. पहिल्या लॉगिननंतर ते आपला पासवर्ड बदलू शकतील.
                </p>
              </div>
            </div>

            {/* Credentials Card */}
            <div className="bg-[#FAF9F6] border-2 border-[#E5E1D8] rounded-2xl p-4 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#6B6459] font-medium">नाव:</span>
                <span className="font-bold text-[#292118]">{credentialsModal.user.full_name}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#6B6459] font-medium">युझरनेम (Username):</span>
                <span className="font-mono font-bold text-[#C2410C] bg-orange-100/60 px-2 py-0.5 rounded">
                  {credentialsModal.user.username}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#6B6459] font-medium">डिफॉल्ट पासवर्ड:</span>
                <span className="font-mono font-bold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded">
                  {credentialsModal.defaultPassword}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#6B6459] font-medium">लॉगिन लिंक:</span>
                <a
                  href={credentialsModal.loginUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  <span>digital-vargani-mu.vercel.app/login</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={() => handleShareWhatsApp(credentialsModal.shareableMessage, credentialsModal.user.phone)}
                className="font-bold gap-2 bg-[#25D366] hover:bg-[#1EBE5D] border-transparent text-white shadow-md shadow-emerald-500/20"
              >
                <span>💬 व्हॉट्सॲपवर पाठवा (Share via WhatsApp)</span>
              </Button>

              <Button
                variant="outline"
                size="md"
                fullWidth
                onClick={() => handleCopyCredentials(credentialsModal.shareableMessage)}
                className="font-semibold gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">माहिती कॉपी झाली! (Copied)</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-[#6B6459]" />
                    <span>लॉगिन माहिती कॉपी करा (Copy Details)</span>
                  </>
                )}
              </Button>

              <Button
                variant="secondary"
                size="sm"
                fullWidth
                onClick={() => setCredentialsModal(null)}
                className="mt-2 text-xs"
              >
                पूर्ण झाले (Done)
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
