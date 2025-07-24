import React from 'react';
import { VStack } from '@chakra-ui/react';
import FormSection, { 
  ScaleQuestion, 
  MultipleChoiceQuestion, 
  TextQuestion 
} from '../components/FormSection';

const BookingManagementSection = ({ data, onChange }) => {
  const updateData = (field, value) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  return (
    <VStack spacing={6} align="stretch">
      <FormSection
        title="Booking Management Testing"
        description="Akses menu Booking Management dan test approval workflow"
        isRequired={true}
        alertMessage="Pastikan Anda telah mencoba fitur-fitur Booking Management sesuai role"
        alertType="warning"
      >
        <VStack spacing={6} align="stretch">
          <ScaleQuestion
            label="1. Bagaimana tampilan daftar booking?"
            value={data.booking_list_view}
            onChange={(value) => updateData('booking_list_view', value)}
            labels={['Sangat Buruk', 'Buruk', 'Cukup', 'Baik', 'Sangat Baik']}
          />

          <MultipleChoiceQuestion
            label="2. Apakah informasi detail booking lengkap dan jelas?"
            value={data.booking_details}
            onChange={(value) => updateData('booking_details', value)}
            options={[
              { value: 'very_complete', label: 'Sangat lengkap dan jelas' },
              { value: 'complete', label: 'Lengkap dan jelas' },
              { value: 'adequate', label: 'Cukup lengkap' },
              { value: 'incomplete', label: 'Kurang lengkap' },
              { value: 'very_incomplete', label: 'Tidak lengkap sama sekali' }
            ]}
          />

          <ScaleQuestion
            label="3. Seberapa mudah proses approve/reject booking?"
            value={data.approval_process}
            onChange={(value) => updateData('approval_process', value)}
            labels={['Sangat Sulit', 'Sulit', 'Cukup', 'Mudah', 'Sangat Mudah']}
          />

          <MultipleChoiceQuestion
            label="4. Apakah perubahan status booking real-time?"
            value={data.status_updates}
            onChange={(value) => updateData('status_updates', value)}
            options={[
              { value: 'immediate', label: 'Ya, langsung terupdate' },
              { value: '1-2min', label: 'Ya, terupdate dalam 1-2 menit' },
              { value: '5-10min', label: 'Ya, terupdate dalam 5-10 menit' },
              { value: 'not_realtime', label: 'Tidak real-time' },
              { value: 'unknown', label: 'Tidak tahu' }
            ]}
          />

          <ScaleQuestion
            label="5. Bagaimana fitur filter dan pencarian booking?"
            value={data.filter_search}
            onChange={(value) => updateData('filter_search', value)}
            labels={['Sangat Buruk', 'Buruk', 'Cukup', 'Baik', 'Sangat Baik']}
          />

          <TextQuestion
            label="6. Booking Management Feedback (Opsional)"
            value={data.booking_management_feedback}
            onChange={(value) => updateData('booking_management_feedback', value)}
            placeholder="Saran perbaikan untuk Booking Management?"
            isTextarea={true}
            isRequired={false}
          />
        </VStack>
      </FormSection>
    </VStack>
  );
};

export default BookingManagementSection;
