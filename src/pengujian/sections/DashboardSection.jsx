import React from 'react';
import { VStack } from '@chakra-ui/react';
import FormSection, { 
  ScaleQuestion, 
  MultipleChoiceQuestion, 
  TextQuestion 
} from '../components/FormSection';

const DashboardSection = ({ data, onChange }) => {
  const updateData = (field, value) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  return (
    <VStack spacing={6} align="stretch">
      <FormSection
        title="Dashboard & Navigation Testing"
        description="Navigasi ke halaman dashboard dan lakukan eksplorasi menu"
        isRequired={true}
        alertMessage="Pastikan Anda telah mengeksplorasi dashboard dan menu navigasi"
        alertType="info"
      >
        <VStack spacing={6} align="stretch">
          <ScaleQuestion
            label="1. Seberapa informatif dashboard utama?"
            value={data.dashboard_informativeness}
            onChange={(value) => updateData('dashboard_informativeness', value)}
            labels={['Tidak Informatif', 'Kurang Informatif', 'Cukup Informatif', 'Informatif', 'Sangat Informatif']}
          />

          <ScaleQuestion
            label="2. Seberapa mudah navigasi antar menu?"
            value={data.navigation_ease}
            onChange={(value) => updateData('navigation_ease', value)}
            labels={['Sangat Sulit', 'Sulit', 'Cukup', 'Mudah', 'Sangat Mudah']}
          />

          <MultipleChoiceQuestion
            label="3. Apakah struktur menu logis dan mudah dipahami?"
            value={data.menu_structure}
            onChange={(value) => updateData('menu_structure', value)}
            options={[
              { value: 'very_easy', label: 'Sangat mudah dipahami' },
              { value: 'easy', label: 'Mudah dipahami' },
              { value: 'moderate', label: 'Cukup mudah dipahami' },
              { value: 'difficult', label: 'Sulit dipahami' },
              { value: 'very_difficult', label: 'Sangat sulit dipahami' }
            ]}
          />

          <MultipleChoiceQuestion
            label="4. Bagaimana kecepatan loading halaman?"
            value={data.response_time}
            onChange={(value) => updateData('response_time', value)}
            options={[
              { value: 'very_fast', label: 'Sangat cepat (< 2 detik)' },
              { value: 'fast', label: 'Cepat (2-5 detik)' },
              { value: 'normal', label: 'Normal (5-10 detik)' },
              { value: 'slow', label: 'Lambat (10-20 detik)' },
              { value: 'very_slow', label: 'Sangat lambat (> 20 detik)' }
            ]}
          />

          <TextQuestion
            label="5. Saran Perbaikan Dashboard (Opsional)"
            value={data.dashboard_suggestions}
            onChange={(value) => updateData('dashboard_suggestions', value)}
            placeholder="Apa yang perlu diperbaiki dari dashboard?"
            isTextarea={true}
            isRequired={false}
          />
        </VStack>
      </FormSection>
    </VStack>
  );
};

export default DashboardSection;
