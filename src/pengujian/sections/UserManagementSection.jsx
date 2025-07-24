import React from 'react';
import { VStack } from '@chakra-ui/react';
import FormSection, { 
  ScaleQuestion, 
  MultipleChoiceQuestion, 
  TextQuestion 
} from '../components/FormSection';

const UserManagementSection = ({ data, onChange }) => {
  const updateData = (field, value) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  return (
    <VStack spacing={6} align="stretch">
      <FormSection
        title="User Management Testing"
        description="Coba akses menu User Management dan lakukan operasi berikut"
        isRequired={true}
        alertMessage="Pastikan Anda telah mencoba fitur-fitur User Management"
        alertType="warning"
      >
        <VStack spacing={6} align="stretch">
          <ScaleQuestion
            label="1. Coba buat user baru. Seberapa mudah prosesnya?"
            value={data.create_user_ease}
            onChange={(value) => updateData('create_user_ease', value)}
            labels={['Sangat Sulit', 'Sulit', 'Cukup', 'Mudah', 'Sangat Mudah']}
          />

          <MultipleChoiceQuestion
            label="2. Apakah sistem memberikan error yang jelas saat input invalid?"
            value={data.user_validation}
            onChange={(value) => updateData('user_validation', value)}
            options={[
              { value: 'very_clear', label: 'Ya, error message sangat jelas' },
              { value: 'clear', label: 'Ya, error message cukup jelas' },
              { value: 'unclear', label: 'Error message tidak jelas' },
              { value: 'none', label: 'Tidak ada error message' },
              { value: 'not_tried', label: 'Tidak mencoba' }
            ]}
          />

          <ScaleQuestion
            label="3. Coba edit data user. Seberapa mudah prosesnya?"
            value={data.edit_user_ease}
            onChange={(value) => updateData('edit_user_ease', value)}
            labels={['Sangat Sulit', 'Sulit', 'Cukup', 'Mudah', 'Sangat Mudah']}
          />

          <MultipleChoiceQuestion
            label="4. Apakah sistem meminta konfirmasi saat hapus user?"
            value={data.delete_confirmation}
            onChange={(value) => updateData('delete_confirmation', value)}
            options={[
              { value: 'clear_confirmation', label: 'Ya, ada konfirmasi yang jelas' },
              { value: 'unclear_confirmation', label: 'Ya, ada konfirmasi tapi tidak jelas' },
              { value: 'no_confirmation', label: 'Tidak ada konfirmasi' },
              { value: 'not_tried', label: 'Tidak mencoba' }
            ]}
          />

          <ScaleQuestion
            label="5. Bagaimana tampilan daftar user?"
            value={data.user_list_display}
            onChange={(value) => updateData('user_list_display', value)}
            labels={['Sangat Buruk', 'Buruk', 'Cukup', 'Baik', 'Sangat Baik']}
          />

          <TextQuestion
            label="6. Issue User Management (Opsional)"
            value={data.user_management_issues}
            onChange={(value) => updateData('user_management_issues', value)}
            placeholder="Apakah ada masalah dalam User Management? Jelaskan..."
            isTextarea={true}
            isRequired={false}
          />
        </VStack>
      </FormSection>
    </VStack>
  );
};

export default UserManagementSection;
