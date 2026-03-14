import HospitalForm from '@/components/admin/hospitals/HospitalForm';
import { use } from 'react';

export default function EditHospitalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <HospitalForm mode="edit" hospitalId={id} />;
}
