import React from 'react';
import { VStack } from '@chakra-ui/react';
import FormSection, { 
  MultipleChoiceQuestion, 
  TextQuestion 
} from '../components/FormSection';

const TechnicalIssuesSection = ({ data, onChange }) => {
  const updateData = (field, value) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  return (
    <VStack spacing={6} align="stretch">
      <FormSection
        title="Technical Issues"
        description="Informasi teknis yang dapat membantu analisis"
        isRequired={false}
        alertMessage="Section ini opsional namun sangat membantu untuk analisis teknis"
        alertType="info"
      >
        <VStack spacing={6} align="stretch">
          <MultipleChoiceQuestion
            label="1. Browser apa yang Anda gunakan untuk testing?"
            value={data.browser_used}
            onChange={(value) => updateData('browser_used', value)}
            options={[
              { value: 'chrome', label: 'Chrome' },
              { value: 'firefox', label: 'Firefox' },
              { value: 'safari', label: 'Safari' },
              { value: 'edge', label: 'Edge' },
              { value: 'other', label: 'Lainnya' }
            ]}
            isRequired={false}
          />

          <MultipleChoiceQuestion
            label="2. Device apa yang digunakan?"
            value={data.device_used}
            onChange={(value) => updateData('device_used', value)}
            options={[
              { value: 'desktop', label: 'Desktop/Laptop' },
              { value: 'tablet', label: 'Tablet' },
              { value: 'mobile', label: 'Mobile Phone' }
            ]}
            isRequired={false}
          />

          <MultipleChoiceQuestion
            label="3. Resolusi layar yang digunakan?"
            value={data.screen_resolution}
            onChange={(value) => updateData('screen_resolution', value)}
            options={[
              { value: 'high', label: '1920x1080 atau lebih tinggi' },
              { value: 'medium', label: '1366x768' },
              { value: 'low', label: '1280x720' },
              { value: 'mobile', label: 'Mobile resolution' },
              { value: 'other', label: 'Lainnya' }
            ]}
            isRequired={false}
          />

          <MultipleChoiceQuestion
            label="4. Kecepatan internet saat testing?"
            value={data.internet_connection}
            onChange={(value) => updateData('internet_connection', value)}
            options={[
              { value: 'very_fast', label: 'Sangat cepat (>50 Mbps)' },
              { value: 'fast', label: 'Cepat (10-50 Mbps)' },
              { value: 'medium', label: 'Sedang (1-10 Mbps)' },
              { value: 'slow', label: 'Lambat (<1 Mbps)' }
            ]}
            isRequired={false}
          />

          <TextQuestion
            label="5. Technical Issues Encountered (Opsional)"
            value={data.technical_issues}
            onChange={(value) => updateData('technical_issues', value)}
            placeholder="Masalah teknis apa yang ditemukan?"
            isTextarea={true}
            isRequired={false}
          />
        </VStack>
      </FormSection>
    </VStack>
  );
};

export default TechnicalIssuesSection;
