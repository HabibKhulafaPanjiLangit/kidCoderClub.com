import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  BookOpen, 
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Wallet,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface Profile {
  id: string;
  full_name: string;
  role: string;
  created_at: string;
  user_id: string;
}

interface Transaction {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  user_id: string;
  classes: {
    title: string;
  };
}

interface ClassItem {
  id: string;
  title: string;
  level: string;
  price: number;
  is_active: boolean;
  created_at: string;
}

interface ChartData {
  name: string;
  pemasukan: number;
  pengeluaran: number;
}

const AdminDashboard = () => {
  const { profile } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalClasses: 0,
    totalPemasukan: 0,
    totalPengeluaran: 0,
    totalEnrollments: 0,
    pendingTransactions: 0
  });
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);

    const { data: userData } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (userData) {
      setUsers(userData);
      setStats(prev => ({ ...prev, totalUsers: userData.length }));
    }

    const { data: transactionData } = await supabase
      .from('transactions')
      .select(`id, amount, status, created_at, user_id, classes (title)`)
      .order('created_at', { ascending: false });

    if (transactionData) {
      setTransactions(transactionData as unknown as Transaction[]);
      const totalPemasukan = transactionData
        .filter(t => t.status === 'paid')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const pendingTransactions = transactionData.filter(t => t.status === 'pending').length;
      setStats(prev => ({ ...prev, totalPemasukan, pendingTransactions }));
    }

    // Fetch mentor salaries for pengeluaran
    const { data: salariesData } = await supabase
      .from('mentor_salaries')
      .select('*');

    if (salariesData) {
      const totalPengeluaran = salariesData
        .filter(s => s.status === 'paid')
        .reduce((sum, s) => sum + Number(s.amount), 0);
      setStats(prev => ({ ...prev, totalPengeluaran }));
    }

    // Generate chart data from transactions and salaries
    const monthlyData = generateChartData(transactionData || [], salariesData || []);
    setChartData(monthlyData);

    const { data: classData } = await supabase
      .from('classes')
      .select('*')
      .order('created_at', { ascending: false });

    if (classData) {
      setClasses(classData);
      setStats(prev => ({ ...prev, totalClasses: classData.length }));
    }

    const { count: enrollmentCount } = await supabase
      .from('enrollments')
      .select('*', { count: 'exact', head: true });

    setStats(prev => ({ ...prev, totalEnrollments: enrollmentCount || 0 }));
    setLoading(false);
  };

  const generateChartData = (transactions: any[], salaries: any[]): ChartData[] => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    
    return months.map((month, index) => {
      const monthTransactions = transactions.filter(t => {
        const date = new Date(t.created_at);
        return date.getMonth() === index && date.getFullYear() === currentYear && t.status === 'paid';
      });
      
      const monthSalaries = salaries.filter(s => {
        const date = new Date(s.created_at);
        return date.getMonth() === index && date.getFullYear() === currentYear && s.status === 'paid';
      });

      return {
        name: month,
        pemasukan: monthTransactions.reduce((sum, t) => sum + Number(t.amount), 0),
        pengeluaran: monthSalaries.reduce((sum, s) => sum + Number(s.amount), 0)
      };
    });
  };

  useEffect(() => {
    fetchData();

    // Realtime subscriptions
    const transactionsChannel = supabase
      .channel('dashboard_transactions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => fetchData())
      .subscribe();

    const salariesChannel = supabase
      .channel('dashboard_salaries')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mentor_salaries' }, () => fetchData())
      .subscribe();

    const enrollmentsChannel = supabase
      .channel('dashboard_enrollments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'enrollments' }, () => fetchData())
      .subscribe();

    const profilesChannel = supabase
      .channel('dashboard_profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(transactionsChannel);
      supabase.removeChannel(salariesChannel);
      supabase.removeChannel(enrollmentsChannel);
      supabase.removeChannel(profilesChannel);
    };
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Lunas</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Pending</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Ditolak</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const saldoBersih = stats.totalPemasukan - stats.totalPengeluaran;

  const statCards = [
    { icon: Users, label: 'Total Pengguna', value: stats.totalUsers, color: 'text-primary', bgColor: 'bg-primary/10' },
    { icon: TrendingUp, label: 'Total Pemasukan', value: `Rp ${stats.totalPemasukan.toLocaleString()}`, color: 'text-green-600', bgColor: 'bg-green-500/10', subIcon: ArrowUpRight },
    { icon: TrendingDown, label: 'Total Pengeluaran', value: `Rp ${stats.totalPengeluaran.toLocaleString()}`, color: 'text-red-600', bgColor: 'bg-red-500/10', subIcon: ArrowDownRight },
    { icon: Wallet, label: 'Saldo Bersih', value: `Rp ${saldoBersih.toLocaleString()}`, color: saldoBersih >= 0 ? 'text-green-600' : 'text-red-600', bgColor: saldoBersih >= 0 ? 'bg-green-500/10' : 'bg-red-500/10' },
  ];

  const statCards2 = [
    { icon: BookOpen, label: 'Total Kelas', value: stats.totalClasses, color: 'text-secondary', bgColor: 'bg-secondary/10' },
    { icon: Users, label: 'Pendaftaran', value: stats.totalEnrollments, color: 'text-accent', bgColor: 'bg-accent/10' },
  ];

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Ringkasan Dashboard</h1>
            <p className="text-slate-500">Selamat datang kembali, {profile?.full_name}</p>
          </div>
          <Button onClick={fetchData} variant="outline" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Muat Ulang
          </Button>
        </div>

        {/* Financial Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {statCards.map((stat, index) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
              <Card className="bg-white">
                <CardContent className="p-6">
                  <div className={`inline-flex p-3 rounded-xl ${stat.bgColor} mb-4`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                  <div className="text-sm text-slate-500">{stat.label}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Other Stats */}
        <div className="grid grid-cols-2 md:grid-cols-2 gap-4 mb-8">
          {statCards2.map((stat, index) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (index + 4) * 0.1 }}>
              <Card className="bg-white">
                <CardContent className="p-6">
                  <div className={`inline-flex p-3 rounded-xl ${stat.bgColor} mb-4`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                  <div className="text-sm text-slate-500">{stat.label}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card className="bg-white">
            <CardHeader><CardTitle>Pemasukan vs Pengeluaran (Bulanan)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" />
                  <YAxis stroke="#64748b" tickFormatter={(value) => `${(value / 1000000).toFixed(1)}jt`} />
                  <Tooltip formatter={(value: number) => `Rp ${value.toLocaleString()}`} />
                  <Area type="monotone" dataKey="pemasukan" stackId="1" stroke="hsl(142 71% 45%)" fill="hsl(142 71% 45% / 0.3)" name="Pemasukan" />
                  <Area type="monotone" dataKey="pengeluaran" stackId="2" stroke="hsl(0 84% 60%)" fill="hsl(0 84% 60% / 0.3)" name="Pengeluaran" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader><CardTitle>Transaksi Terbaru</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kelas</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.length > 0 ? transactions.slice(0, 5).map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.classes?.title || 'N/A'}</TableCell>
                      <TableCell>Rp {Number(t.amount).toLocaleString()}</TableCell>
                      <TableCell>{getStatusBadge(t.status)}</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={3} className="text-center py-8 text-slate-500">Belum ada transaksi</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="bg-white">
            <CardHeader><CardTitle>User Terbaru</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Nama</TableHead><TableHead>Role</TableHead><TableHead>Tanggal</TableHead></TableRow></TableHeader>
                <TableBody>
                  {users.slice(0, 5).map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.full_name}</TableCell>
                      <TableCell><Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>{user.role}</Badge></TableCell>
                      <TableCell className="text-slate-500">{new Date(user.created_at).toLocaleDateString('id-ID')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader><CardTitle>Daftar Kelas</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Judul</TableHead><TableHead>Level</TableHead><TableHead>Harga</TableHead></TableRow></TableHeader>
                <TableBody>
                  {classes.slice(0, 5).map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.title}</TableCell>
                      <TableCell><Badge variant="outline">{c.level}</Badge></TableCell>
                      <TableCell>{c.price === 0 ? 'Gratis' : `Rp ${c.price.toLocaleString()}`}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
