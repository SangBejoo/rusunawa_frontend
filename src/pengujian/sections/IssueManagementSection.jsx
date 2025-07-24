import React from 'react';
import { VStack } from '@chakra-ui/react';
import FormSection, { 
  ScaleQuestion, 
  MultipleChoiceQuestion, 
  TextQuestion 
} from '../components/FormSection';

const IssueManagementSection = ({ data, onChange }) => {
  const updateData = (field, value) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  return (
    <VStack spacing={6} align="stretch">
      <FormSection
        title="Issue Management Testing"
        description="Test fitur manajemen issue/keluhan"
        isRequired={true}
        alertMessage="Pastikan Anda telah mencoba fitur-fitur Issue Management"
        alertType="info"
      >
        <VStack spacing={6} align="stretch">
          <ScaleQuestion
            label="1. Bagaimana tampilan daftar issue?"
            value={data.issue_list_display}
            onChange={(value) => updateData('issue_list_display', value)}
            labels={['Sangat Buruk', 'Buruk', 'Cukup', 'Baik', 'Sangat Baik']}
          />

          <MultipleChoiceQuestion
            label="2. Apakah detail issue lengkap dan informatif?"
            value={data.issue_details}
            onChange={(value) => updateData('issue_details', value)}
            options={[
              { value: 'very_complete', label: 'Sangat lengkap dan informatif' },
              { value: 'complete', label: 'Lengkap dan informatif' },
              { value: 'adequate', label: 'Cukup lengkap' },
              { value: 'incomplete', label: 'Kurang lengkap' },
              { value: 'very_incomplete', label: 'Tidak lengkap' }
            ]}
          />

          <ScaleQuestion
            label="3. Seberapa mudah update status issue?"
            value={data.status_management}
            onChange={(value) => updateData('status_management', value)}
            labels={['Sangat Sulit', 'Sulit', 'Cukup', 'Mudah', 'Sangat Mudah']}
          />

          <MultipleChoiceQuestion
            label="4. Bagaimana fitur lihat attachment gambar?"
            value={data.attachment_viewing}
            onChange={(value) => updateData('attachment_viewing', value)}
            options={[
              { value: 'very_good', label: 'Sangat baik, gambar jelas' },
              { value: 'good', label: 'Baik, gambar cukup jelas' },
              { value: 'adequate', label: 'Cukup baik' },
              { value: 'poor', label: 'Kurang baik' },
              { value: 'not_working', label: 'Tidak berfungsi' }
            ]}
          />

          <TextQuestion
            label="5. Issue Management Feedback (Opsional)"
            value={data.issue_management_feedback}
            onChange={(value) => updateData('issue_management_feedback', value)}
            placeholder="Saran perbaikan Issue Management?"
            isTextarea={true}
            isRequired={false}
          />
        </VStack>
      </FormSection>
    </VStack>
  );
};

export default IssueManagementSection;
