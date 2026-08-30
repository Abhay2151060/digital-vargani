'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Header } from '../../../components/Header';
import { OfflineBanner } from '../../../components/OfflineBanner';
import { Card, Input, Button, StatusBadge, Modal } from '@vargani/ui';
import { apiRequest } from '../../../lib/api-client';
import { getT } from '../../../lib/i18n';
import { ExpenseCategory, ExpenseStatus, Role } from '@vargani/types';
import Link from 'next/link';
import { PlusCircle, Image as ImageIcon } from 'lucide-react';

export default function ExpensesPage() {
  const { activeMandal, role, token, language } = useAuth();
  const t = getT(language);

  const [expenses, setExpenses] = useState<any[]>([]);
  const [, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [category, setCategory] = useState<ExpenseCategory>(ExpenseCategory.MANDAP);
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState('');
  const [billUrl, setBillUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExpenses = () => {
    if (activeMandal && token) {
      apiRequest<any[]>('/expenses')
        .then(setExpenses)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [activeMandal, token]);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('कृपया वैध खर्च रक्कम टाका');
      return;
    }
    if (!description.trim()) {
      setError('खर्चाचा तपशील आवश्यक आहे');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await apiRequest('/expenses', {
        method: 'POST',
        body: JSON.stringify({
          category,
          amount: parsedAmount,
          description: description.trim(),
          bill_photo_url: billUrl.trim() || undefined,
        }),
      });

      setIsModalOpen(false);
      setAmount('');
      setDescription('');
      setBillUrl('');
      fetchExpenses();
    } catch (err: any) {
      setError(err.message || 'खर्च नोंदवण्यात त्रुटी आली');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (expenseId: string, status: ExpenseStatus) => {
    try {
      await apiRequest('/expenses/status', {
        method: 'PUT',
        body: JSON.stringify({
          expense_id: expenseId,
          status,
        }),
      });
      fetchExpenses();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const isAdmin = role === Role.ADMIN;

  const totalApproved = expenses
    .filter((e) => e.status === ExpenseStatus.APPROVED)
    .reduce((sum, e) => sum + parseFloat(e.amount), 0);

  const totalPending = expenses
    .filter((e) => e.status === ExpenseStatus.PENDING)
    .reduce((sum, e) => sum + parseFloat(e.amount), 0);

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
          <Link href="/expenses" className="px-3 py-1.5 rounded-lg bg-orange-50 text-[#F97316] font-bold border border-orange-200">
            {t.expenses}
          </Link>
          <Link href="/members" className="px-3 py-1.5 rounded-lg text-[#6B6459] hover:bg-[#F3F1EC]">
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
            <h2 className="text-xl font-extrabold text-[#292118]">{t.expenses} (Festival Expenses)</h2>
            <p className="text-xs text-[#6B6459] mt-0.5">
              मंडपाचे डेकोरेशन, मूर्ती, ध्वनीव्यवस्था आणि इतर खर्चाची पावतीसह नोंद व मंजुरी.
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={() => setIsModalOpen(true)}
            className="font-bold gap-1.5 self-start"
          >
            <PlusCircle className="w-4 h-4" />
            <span>नवीन खर्च नोंदवा</span>
          </Button>
        </div>

        {/* Expense Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card variant="default" padding="md" className="border-l-4 border-l-emerald-600 shadow-xs">
            <span className="text-xs font-semibold text-[#6B6459] uppercase">मंजूर खर्च (Approved)</span>
            <p className="text-2xl font-black text-emerald-800 mt-1">
              ₹{totalApproved.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-emerald-600 mt-0.5">पारदर्शकता पोर्टलवर समाविष्ट</p>
          </Card>

          <Card variant="default" padding="md" className="border-l-4 border-l-amber-500 shadow-xs">
            <span className="text-xs font-semibold text-[#6B6459] uppercase">मंजुरी प्रलंबित (Pending Approval)</span>
            <p className="text-2xl font-black text-amber-700 mt-1">
              ₹{totalPending.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-amber-700 mt-0.5">Admin मंजुरीची आवश्यकता</p>
          </Card>
        </div>

        {/* Expenses List */}
        <Card variant="default" padding="none" className="shadow-sm overflow-hidden">
          <div className="p-4 border-b border-[#E5E1D8] flex items-center justify-between">
            <h3 className="text-base font-bold text-[#292118]">खर्च नोंदींची यादी (Expenses List)</h3>
            <span className="text-xs text-[#6B6459]">{expenses.length} नोंदी</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#F3F1EC] text-[#6B6459] font-bold text-xs uppercase border-b border-[#E5E1D8]">
                <tr>
                  <th className="px-4 py-3">वर्गवारी (Category)</th>
                  <th className="px-4 py-3">तपशील (Description)</th>
                  <th className="px-4 py-3 text-right">रक्कम (₹)</th>
                  <th className="px-4 py-3">नोंदवणारा</th>
                  <th className="px-4 py-3 text-center">बिल पावती</th>
                  <th className="px-4 py-3 text-center">स्थिती (Status)</th>
                  {isAdmin && <th className="px-4 py-3 text-center">Admin कृती</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E1D8]">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 7 : 6} className="px-4 py-8 text-center text-[#A8A297]">
                      अद्याप कोणताही खर्च नोंदवलेला नाही
                    </td>
                  </tr>
                ) : (
                  expenses.map((e) => (
                    <tr key={e.id} className="hover:bg-orange-50/20 transition">
                      <td className="px-4 py-3 font-semibold text-[#292118]">
                        <span className="bg-[#F3F1EC] px-2 py-0.5 rounded text-xs font-bold text-[#7C2D12]">
                          {e.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#292118] max-w-xs">{e.description}</td>
                      <td className="px-4 py-3 text-right font-bold text-[#7C2D12]">
                        ₹{parseFloat(e.amount).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-[#6B6459] text-xs">{e.logged_by_name}</td>
                      <td className="px-4 py-3 text-center">
                        {e.bill_photo_url ? (
                          <a
                            href={e.bill_photo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline font-semibold"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>पहा</span>
                          </a>
                        ) : (
                          <span className="text-[#A8A297] text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {e.status === ExpenseStatus.APPROVED ? (
                          <StatusBadge status="success" label="Approved" size="sm" />
                        ) : e.status === ExpenseStatus.REJECTED ? (
                          <StatusBadge status="error" label="Rejected" size="sm" />
                        ) : (
                          <StatusBadge status="warning" label="Pending" size="sm" />
                        )}
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3 text-center">
                          {e.status === ExpenseStatus.PENDING ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleUpdateStatus(e.id, ExpenseStatus.APPROVED)}
                                title="Approve"
                                className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition"
                              >
                                मंजूर
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(e.id, ExpenseStatus.REJECTED)}
                                title="Reject"
                                className="px-2.5 py-1 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition"
                              >
                                नामंजूर
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-[#6B6459]">
                              {e.approved_by_name ? `By ${e.approved_by_name}` : 'Settled'}
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </main>

      {/* Add Expense Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="नवीन खर्च नोंदवा">
        <form onSubmit={handleCreateExpense} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          <div className="space-y-1 text-left">
            <label className="text-sm font-medium text-[#292118]">खर्च वर्गवारी (Category)</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              className="w-full min-h-[48px] rounded-xl border-2 border-[#E5E1D8] bg-white px-3.5 text-base text-[#292118] focus:border-[#F97316] focus:outline-none"
            >
              <option value={ExpenseCategory.MANDAP}>मंडप डेकोरेशन (Mandap)</option>
              <option value={ExpenseCategory.IDOL}>मूर्ती (Idol / Murti)</option>
              <option value={ExpenseCategory.SOUND_LIGHTING}>साऊंड व लाईटिंग (Sound & Lighting)</option>
              <option value={ExpenseCategory.PRASAD}>प्रसाद व पूजा साहित्य (Prasad & Puja)</option>
              <option value={ExpenseCategory.SECURITY}>सुरक्षा व सीसीटीव्ही (Security)</option>
              <option value={ExpenseCategory.PERMISSIONS}>परवानग्या व शासकीय शुल्क (Permissions)</option>
              <option value={ExpenseCategory.MARKETING}>बॅनर व प्रचार (Marketing)</option>
              <option value={ExpenseCategory.OTHER}>इतर किरकोळ खर्च (Other)</option>
            </select>
          </div>

          <Input
            label="खर्च रक्कम (₹)"
            type="number"
            placeholder="उदा. 5000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />

          <Input
            label="तपशील / कोणाला दिले (Description)"
            placeholder="उदा. मंडप advance / जनरेटर डिझेल"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />

          <Input
            label="बिल पावती फोटो URL (Optional Bill Photo Link)"
            placeholder="https://example.com/bill.jpg"
            value={billUrl}
            onChange={(e) => setBillUrl(e.target.value)}
          />

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isSubmitting}
              className="font-bold"
            >
              <span>खर्च सादर करा</span>
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
