import React from 'react';
import { VStack } from '@chakra-ui/react';
import FormSection, { 
  ScaleQuestion, 
  MultipleChoiceQuestion, 
  TextQuestion 
} from '../components/FormSection';

const NotificationSection = ({ data, onChange }) => {
  const updateData = (field, value) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  return (
    <VStack spacing={6} align="stretch">
      <FormSection
        title="Notification System Testing"
        description="Test sistem notifikasi"
        isRequired={true}
        alertMessage="Pastikan Anda telah mencoba fitur-fitur Notification System"
        alertType="info"
      >
        <VStack spacing={6} align="stretch">
          <ScaleQuestion
            label="1. Bagaimana tampilan notifikasi?"
            value={data.notification_display}
            onChange={(value) => updateData('notification_display', value)}
            labels={['Sangat Buruk', 'Buruk', 'Cukup', 'Baik', 'Sangat Baik']}
          />

          <MultipleChoiceQuestion
            label="2. Apakah notifikasi real-time?"
            value={data.realtime_updates}
            onChange={(value) => updateData('realtime_updates', value)}
            options={[
              { value: 'very_realtime', label: 'Ya, sangat real-time' },
              { value: 'realtime', label: 'Ya, cukup real-time' },
              { value: 'delayed', label: 'Kadang-kadang delay' },
              { value: 'not_realtime', label: 'Tidak real-time' },
              { value: 'unknown', label: 'Tidak tahu' }
            ]}
          />

          <ScaleQuestion
            label="3. Seberapa mudah mark notifikasi sebagai read?"
            value={data.mark_as_read}
            onChange={(value) => updateData('mark_as_read', value)}
            labels={['Sangat Sulit', 'Sulit', 'Cukup', 'Mudah', 'Sangat Mudah']}
          />

          <MultipleChoiceQuestion
            label="4. Apakah notifikasi yang diterima relevan dengan role Anda?"
            value={data.notification_relevance}
            onChange={(value) => updateData('notification_relevance', value)}
            options={[
              { value: 'very_relevant', label: 'Sangat relevan' },
              { value: 'relevant', label: 'Relevan' },
              { value: 'adequate', label: 'Cukup relevan' },
              { value: 'less_relevant', label: 'Kurang relevan' },
              { value: 'not_relevant', label: 'Tidak relevan' }
            ]}
          />

          <TextQuestion
            label="5. Notification System Feedback (Opsional)"
            value={data.notification_system_feedback}
            onChange={(value) => updateData('notification_system_feedback', value)}
            placeholder="Saran untuk sistem notifikasi?"
            isTextarea={true}
            isRequired={false}
          />
        </VStack>
      </FormSection>
    </VStack>
  );
};

export default NotificationSection;
