'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Modal, ConfirmModal } from '@/components/ui/modal'
import { Toggle } from '@/components/ui/toggle'
import { BilingualText } from '@/components/ui/bilingual-text'
import { Badge } from '@/components/ui/badge'
import { t } from '@/lib/translations'
import toast from 'react-hot-toast'

interface Owner {
  id: string
  email: string
  name: string
  phone: string
  depositEnabled: boolean
  depositAmount: number | null
  isActive: boolean
  _count: {
    apartments: number
  }
}

export default function OwnersPage() {
  const router = useRouter()
  const [owners, setOwners] = useState<Owner[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedOwner, setSelectedOwner] = useState<Owner | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    depositEnabled: false,
    depositAmount: '',
  })

  useEffect(() => {
    fetchOwners()
  }, [])

  const fetchOwners = async () => {
    try {
      const res = await fetch('/api/owners')
      const data = await res.json()
      setOwners(data)
    } catch {
      toast.error('Failed to fetch owners')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenModal = (owner?: Owner) => {
    if (owner) {
      setSelectedOwner(owner)
      setFormData({
        name: owner.name,
        email: owner.email,
        phone: owner.phone,
        password: '',
        depositEnabled: owner.depositEnabled,
        depositAmount: owner.depositAmount?.toString() || '',
      })
    } else {
      setSelectedOwner(null)
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        depositEnabled: false,
        depositAmount: '',
      })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const url = selectedOwner ? `/api/owners/${selectedOwner.id}` : '/api/owners'
      const method = selectedOwner ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          depositAmount: formData.depositAmount ? parseFloat(formData.depositAmount) : null,
        }),
      })

      if (!res.ok) throw new Error('Failed to save')

      toast.success(`${t.messages.savedSuccessfully.ka} / ${t.messages.savedSuccessfully.en}`)
      setIsModalOpen(false)
      fetchOwners()
    } catch {
      toast.error(`${t.messages.errorOccurred.ka} / ${t.messages.errorOccurred.en}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedOwner) return

    setIsSaving(true)
    try {
      const res = await fetch(`/api/owners/${selectedOwner.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')

      toast.success(`${t.messages.deletedSuccessfully.ka} / ${t.messages.deletedSuccessfully.en}`)
      setIsDeleteModalOpen(false)
      setSelectedOwner(null)
      fetchOwners()
    } catch {
      toast.error(`${t.messages.errorOccurred.ka} / ${t.messages.errorOccurred.en}`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <BilingualText text={t.owners.title} as="h1" size="2xl" />
        <Button onClick={() => handleOpenModal()} leftIcon={<Plus className="w-4 h-4" />}>
          <span>{t.owners.addOwner.ka}</span>
          <span className="ml-1 opacity-80">/ {t.owners.addOwner.en}</span>
        </Button>
      </div>

      {/* Owners List */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto" />
            </div>
          ) : owners.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {t.messages.noDataFound.ka} / {t.messages.noDataFound.en}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t.owners.name.ka} / {t.owners.name.en}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t.owners.email.ka} / {t.owners.email.en}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t.owners.phone.ka} / {t.owners.phone.en}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t.owners.apartmentsCount.ka}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t.owners.depositEnabled.ka}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      {t.common.actions.ka} / {t.common.actions.en}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {owners.map((owner) => (
                    <tr key={owner.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-primary-700 font-medium">
                              {owner.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{owner.name}</div>
                            {!owner.isActive && (
                              <Badge variant="danger" size="sm">Inactive</Badge>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {owner.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {owner.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-600">
                          <Building2 className="w-4 h-4 mr-1" />
                          {owner._count.apartments}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {owner.depositEnabled ? (
                          <Badge variant="success">{owner.depositAmount} GEL</Badge>
                        ) : (
                          <Badge variant="default">OFF</Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenModal(owner)}
                          className="mr-2"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedOwner(owner)
                            setIsDeleteModalOpen(true)
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedOwner ? t.owners.editOwner : t.owners.addOwner}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={t.owners.name}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            type="email"
            label={t.owners.email}
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          <Input
            label={t.owners.phone}
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
            placeholder="+995 555 123 456"
          />
          <Input
            type="password"
            label={t.auth.password}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required={!selectedOwner}
            hint={selectedOwner ? 'Leave empty to keep current password' : undefined}
          />

          <div className="pt-4 border-t">
            <Toggle
              enabled={formData.depositEnabled}
              onChange={(enabled) => setFormData({ ...formData, depositEnabled: enabled })}
              label={t.owners.depositEnabled}
            />
            {formData.depositEnabled && (
              <div className="mt-4">
                <Input
                  type="number"
                  label={t.owners.depositAmount}
                  value={formData.depositAmount}
                  onChange={(e) => setFormData({ ...formData, depositAmount: e.target.value })}
                  placeholder="200"
                  min="0"
                  step="0.01"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              {t.common.cancel.ka} / {t.common.cancel.en}
            </Button>
            <Button type="submit" isLoading={isSaving}>
              {t.common.save.ka} / {t.common.save.en}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title={t.common.delete}
        message={t.messages.confirmDelete}
        variant="danger"
        isLoading={isSaving}
      />
    </div>
  )
}
