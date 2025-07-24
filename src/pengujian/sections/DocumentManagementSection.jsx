import React from 'react';
import { VStack } from '@chakra-ui/react';
import FormSection, { 
  ScaleQuestion, 
  MultipleChoiceQuestion, 
  TextQuestion 
} from '../components/FormSection';

const DocumentManagementSection = ({ data, onChange }) => {
  const updateData = (field, value) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  return (
    <VStack spacing={6} align="stretch">
      <FormSection
        title="Document Management Testing"
        description="Test fitur review dan approval dokumen"
        isRequired={true}
        alertMessage="Pastikan Anda telah mencoba fitur-fitur Document Management"
        alertType="info"
      >
        <VStack spacing={6} align="stretch">
          <ScaleQuestion
            label="1. Bagaimana interface untuk review dokumen?"
            value={data.document_review_interface}
            onChange={(value) => updateData('document_review_interface', value)}
            labels={['Sangat Buruk', 'Buruk', 'Cukup', 'Baik', 'Sangat Baik']}
          />

          <MultipleChoiceQuestion
            label="2. Bagaimana kualitas gambar dokumen yang ditampilkan?"
            value={data.image_quality}
            onChange={(value) => updateData('image_quality', value)}
            options={[
              { value: 'very_clear', label: 'Sangat jelas dan mudah dibaca' },
              { value: 'clear', label: 'Jelas dan mudah dibaca' },
              { value: 'adequate', label: 'Cukup jelas' },
              { value: 'unclear', label: 'Kurang jelas' },
              { value: 'very_unclear', label: 'Tidak jelas sama sekali' }
            ]}
          />

          <ScaleQuestion
            label="3. Seberapa mudah proses approve/reject dokumen?"
            value={data.approval_process}
            onChange={(value) => updateData('approval_process', value)}
            labels={['Sangat Sulit', 'Sulit', 'Cukup', 'Mudah', 'Sangat Mudah']}
          />

          <MultipleChoiceQuestion
            label="4. Apakah fitur batch approve berfungsi dengan baik?"
            value={data.batch_operations}
            onChange={(value) => updateData('batch_operations', value)}
            options={[
              { value: 'very_good', label: 'Ya, sangat baik' },
              { value: 'good', label: 'Ya, cukup baik' },
              { value: 'minor_bugs', label: 'Ya, tapi ada bug kecil' },
              { value: 'not_working', label: 'Tidak berfungsi' },
              { value: 'not_tried', label: 'Tidak mencoba' }
            ]}
          />

          <ScaleQuestion
            label="5. Bagaimana fitur filter dokumen berdasarkan status/tipe?"
            value={data.document_filters}
            onChange={(value) => updateData('document_filters', value)}
            labels={['Sangat Buruk', 'Buruk', 'Cukup', 'Baik', 'Sangat Baik']}
          />

          <TextQuestion
            label="6. Document Management Issues (Opsional)"
            value={data.document_management_issues}
            onChange={(value) => updateData('document_management_issues', value)}
            placeholder="Masalah apa yang ditemukan di Document Management?"
            isTextarea={true}
            isRequired={false}
          />
        </VStack>
      </FormSection>
    </VStack>
  );
};

export default DocumentManagementSection;
