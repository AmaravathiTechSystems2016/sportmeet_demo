import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import {
  Calendar,
  CheckCircle,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  User,
} from 'lucide-react';

const ProfilePage = () => {
  const { user } = useAuth();
  const displayName = user?.full_name || [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.username || 'SportMeet User';
  const role = user?.user_type?.replace('_', ' ') || 'Player';

  const profileFields = useMemo(() => ([
    user?.first_name,
    user?.last_name,
    user?.email,
    user?.phone_number,
    user?.city,
    user?.state,
  ]), [user]);
  const completedFields = profileFields.filter(Boolean).length;
  const completion = Math.round((completedFields / profileFields.length) * 100);

  const details = [
    { label: 'First Name', value: user?.first_name || 'Not provided', icon: User },
    { label: 'Last Name', value: user?.last_name || 'Not provided', icon: User },
    { label: 'Email Address', value: user?.email || 'Not provided', icon: Mail, wide: true },
    { label: 'Phone Number', value: user?.phone_number || 'Not provided', icon: Phone, wide: true },
    { label: 'City', value: user?.city || 'Not provided', icon: MapPin },
    { label: 'State', value: user?.state || 'Not provided', icon: MapPin },
    {
      label: 'Member Since',
      value: user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Not available',
      icon: Calendar,
      wide: true,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F7FAF8]">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="mb-8 overflow-hidden rounded-3xl bg-slate-950 text-white">
          <div className="grid gap-6 p-6 md:grid-cols-[1fr_320px] md:p-8">
            <div>
              <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-bold text-lime-200">
                <ShieldCheck className="h-4 w-4" />
                Account profile
              </p>
              <h1 className="text-3xl font-extrabold md:text-4xl">{displayName}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                Keep your contact information current so booking confirmations, event registrations, and venue updates reach you correctly.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link to="/bookings" className="btn btn-primary">View Bookings</Link>
                <Link to="/venues" className="btn btn-outline border-white/25 text-white hover:bg-white/10">Book a Venue</Link>
              </div>
            </div>
            <div className="rounded-2xl bg-white p-5 text-slate-950">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
                  <User className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-sm font-bold uppercase tracking-wide text-slate-500">{role}</p>
                  <p className="text-xl font-extrabold">{displayName}</p>
                </div>
              </div>
              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between text-sm font-bold">
                  <span>Profile completeness</span>
                  <span className="text-primary-700">{completion}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-primary-500" style={{ width: `${completion}%` }} />
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
          <aside className="space-y-5">
            <Card className="p-5">
              <h2 className="text-lg font-extrabold text-slate-950">Account Status</h2>
              <div className="mt-4 space-y-3">
                <StatusRow label="Email available" done={Boolean(user?.email)} />
                <StatusRow label="Phone available" done={Boolean(user?.phone_number)} />
                <StatusRow label="Location available" done={Boolean(user?.city || user?.state)} />
              </div>
            </Card>

            <Card className="p-5">
              <h2 className="text-lg font-extrabold text-slate-950">Security</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Password changes and advanced security controls can be connected in the next settings pass.
              </p>
              <Button variant="outline" className="mt-4 w-full">
                <Lock className="mr-2 h-4 w-4" />
                Change Password
              </Button>
            </Card>
          </aside>

          <Card className="p-6">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-primary-700">Account information</p>
                <h2 className="mt-1 text-2xl font-extrabold text-slate-950">Profile Details</h2>
              </div>
              <Button variant="outline">Edit Profile</Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {details.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className={`${item.wide ? 'md:col-span-2' : ''} rounded-2xl border border-slate-200 bg-slate-50 p-4`}>
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">{item.label}</p>
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 shrink-0 text-primary-600" />
                      <span className="break-words text-sm font-semibold text-slate-950">{item.value}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

const StatusRow = ({ label, done }) => (
  <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2">
    <span className="text-sm font-semibold text-slate-700">{label}</span>
    <CheckCircle className={`h-5 w-5 ${done ? 'text-primary-600' : 'text-slate-300'}`} />
  </div>
);

export default ProfilePage;
