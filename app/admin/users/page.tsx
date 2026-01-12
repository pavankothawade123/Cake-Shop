'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ErrorMessage } from '@/components/ui/error-message'
import { formatDate } from '@/lib/utils'

export default function AdminUsersPage() {
  const queryClient = useQueryClient()

  const { data: users, isLoading, error } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await fetch('/api/admin/users')
      if (!res.ok) throw new Error('Failed to fetch users')
      return res.json()
    },
  })

  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      })
      if (!res.ok) throw new Error('Failed to update user')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">User Management</h1>

      {isLoading && <LoadingSpinner className="py-12" />}
      {error && <ErrorMessage message="Failed to load users" />}

      {!isLoading && !error && users?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">No users found.</p>
        </div>
      )}

      {!isLoading && !error && users?.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((user: any) => (
            <Card key={user.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{user.name}</CardTitle>
                  <div className="flex gap-2">
                    <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                      {user.role}
                    </Badge>
                    <Badge variant={user.isActive ? 'default' : 'destructive'}>
                      {user.isActive ? 'Active' : 'Disabled'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm mb-4">
                  <p className="text-gray-600">{user.email}</p>
                  <p className="text-gray-600">
                    Joined: {formatDate(user.createdAt)}
                  </p>
                  <p className="text-gray-600">
                    Orders: {user._count.orders} | Reviews: {user._count.reviews}
                  </p>
                </div>
                <Button
                  variant={user.isActive ? 'destructive' : 'default'}
                  size="sm"
                  className="w-full"
                  onClick={() =>
                    toggleUserStatusMutation.mutate({
                      userId: user.id,
                      isActive: !user.isActive,
                    })
                  }
                  disabled={toggleUserStatusMutation.isPending}
                >
                  {user.isActive ? 'Disable Account' : 'Enable Account'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
