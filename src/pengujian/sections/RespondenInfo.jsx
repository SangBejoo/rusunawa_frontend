import React from 'react';
import { VStack } from '@chakra-ui/react';
import FormSection, { 
  TextQuestion, 
  SelectQuestion 
} from '../components/FormSection';

const RespondenInfo = ({ data, onChange }) => {
  const updateData = (field, value) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  return (
    <VStack spacing={6} align="stretch">
      <FormSection
        title="Informasi Responden"
        description="Mohon isi informasi pribadi Anda untuk keperluan identifikasi testing"
        isRequired={true}
        alertMessage="Semua informasi dalam section ini wajib diisi"
        alertType="info"
      >
        <VStack spacing={4} align="stretch">
          <TextQuestion
            label="Nama Lengkap"
            value={data.nama_lengkap}
            onChange={(value) => updateData('nama_lengkap', value)}
            placeholder="Masukkan nama lengkap Anda"
            isRequired={true}
          />

          <SelectQuestion
            label="Role/Posisi"
            value={data.role}
            onChange={(value) => updateData('role', value)}
            options={[
              { value: 'admin', label: 'Admin' },
              { value: 'wakil_direktorat', label: 'Wakil Direktorat' },
              { value: 'super_admin', label: 'Super Admin' }
            ]}
            placeholder="Pilih role Anda..."
            isRequired={true}
          />

          <TextQuestion
            label="Email"
            value={data.email}
            onChange={(value) => updateData('email', value)}
            placeholder="nama@email.com"
            isRequired={true}
          />

          <SelectQuestion
            label="Lama Pengalaman menggunakan sistem serupa"
            value={data.pengalaman}
            onChange={(value) => updateData('pengalaman', value)}
            options={[
              { value: '<1', label: '< 1 tahun' },
              { value: '1-3', label: '1-3 tahun' },
              { value: '3-5', label: '3-5 tahun' },
              { value: '>5', label: '> 5 tahun' }
            ]}
            placeholder="Pilih pengalaman..."
            isRequired={true}
          />
        </VStack>
      </FormSection>
    </VStack>
  );
};

export default RespondenInfo;
