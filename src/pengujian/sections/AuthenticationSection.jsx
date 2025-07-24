import React from 'react';
import { VStack } from '@chakra-ui/react';
import FormSection, { 
  ScaleQuestion, 
  MultipleChoiceQuestion, 
  CheckboxQuestion,
  TextQuestion 
} from '../components/FormSection';

const AuthenticationSection = ({ data, onChange }) => {
  const updateData = (field, value) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  return (
    <VStack spacing={6} align="stretch">
      <FormSection
        title="Authentication & Authorization Testing"
        description="Silakan login ke sistem menggunakan kredensial yang telah diberikan dan jawab pertanyaan berikut"
        isRequired={true}
        alertMessage="Pastikan Anda telah mencoba login ke sistem sebelum mengisi section ini"
        alertType="warning"
      >
        <VStack spacing={6} align="stretch">
          <ScaleQuestion
            label="1. Seberapa mudah proses login ke sistem?"
            value={data.login_ease}
            onChange={(value) => updateData('login_ease', value)}
            labels={['Sangat Sulit', 'Sulit', 'Cukup', 'Mudah', 'Sangat Mudah']}
          />

          <MultipleChoiceQuestion
            label="2. Apakah sistem meminta konfirmasi saat login dari device baru?"
            value={data.login_confirmation}
            onChange={(value) => updateData('login_confirmation', value)}
            options={[
              { value: 'email', label: 'Ya, meminta konfirmasi email' },
              { value: 'sms', label: 'Ya, meminta konfirmasi SMS' },
              { value: 'none', label: 'Tidak ada konfirmasi' },
              { value: 'unknown', label: 'Tidak tahu/tidak mencoba' }
            ]}
          />

          <MultipleChoiceQuestion
            label="3. Apakah sistem logout otomatis setelah idle?"
            value={data.auto_logout}
            onChange={(value) => updateData('auto_logout', value)}
            options={[
              { value: '<30', label: 'Ya, < 30 menit' },
              { value: '30-60', label: 'Ya, 30-60 menit' },
              { value: '>60', label: 'Ya, > 1 jam' },
              { value: 'none', label: 'Tidak ada auto logout' },
              { value: 'unknown', label: 'Tidak tahu' }
            ]}
          />

          <CheckboxQuestion
            label="4. Fitur mana yang dapat Anda akses sesuai role? (Pilih semua yang berlaku)"
            value={data.accessible_features}
            onChange={(value) => updateData('accessible_features', value)}
            options={[
              { value: 'dashboard', label: 'Dashboard' },
              { value: 'user_management', label: 'User Management' },
              { value: 'room_management', label: 'Room Management' },
              { value: 'booking_approval', label: 'Booking Approval' },
              { value: 'document_review', label: 'Document Review' },
              { value: 'payment_verification', label: 'Payment Verification' },
              { value: 'issue_management', label: 'Issue Management' },
              { value: 'notification_management', label: 'Notification Management' }
            ]}
          />

          <TextQuestion
            label="5. Masalah Authentication (Opsional)"
            value={data.auth_issues}
            onChange={(value) => updateData('auth_issues', value)}
            placeholder="Apakah ada masalah saat login/logout? Jelaskan..."
            isTextarea={true}
            isRequired={false}
          />
        </VStack>
      </FormSection>
    </VStack>
  );
};

export default AuthenticationSection;
