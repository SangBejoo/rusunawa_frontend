import React from 'react';
import { VStack } from '@chakra-ui/react';
import FormSection, { 
  ScaleQuestion, 
  MultipleChoiceQuestion, 
  TextQuestion 
} from '../components/FormSection';

const OverallEvaluationSection = ({ data, onChange }) => {
  const updateData = (field, value) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  return (
    <VStack spacing={6} align="stretch">
      <FormSection
        title="Overall System Evaluation"
        description="Evaluasi keseluruhan sistem"
        isRequired={true}
        alertMessage="Section ini adalah evaluasi keseluruhan sistem berdasarkan pengalaman Anda"
        alertType="success"
      >
        <VStack spacing={6} align="stretch">
          <ScaleQuestion
            label="1. Secara keseluruhan, seberapa mudah menggunakan sistem?"
            value={data.overall_usability}
            onChange={(value) => updateData('overall_usability', value)}
            labels={['Sangat Sulit', 'Sulit', 'Cukup', 'Mudah', 'Sangat Mudah']}
          />

          <MultipleChoiceQuestion
            label="2. Bagaimana stabilitas sistem selama penggunaan?"
            value={data.system_stability}
            onChange={(value) => updateData('system_stability', value)}
            options={[
              { value: 'very_stable', label: 'Sangat stabil, tidak ada error' },
              { value: 'stable', label: 'Stabil, error minimal' },
              { value: 'adequate', label: 'Cukup stabil' },
              { value: 'unstable', label: 'Kurang stabil, sering error' },
              { value: 'very_unstable', label: 'Tidak stabil' }
            ]}
          />

          <ScaleQuestion
            label="3. Bagaimana performa sistem secara keseluruhan?"
            value={data.performance}
            onChange={(value) => updateData('performance', value)}
            labels={['Sangat Lambat', 'Lambat', 'Cukup', 'Cepat', 'Sangat Cepat']}
          />

          <ScaleQuestion
            label="4. Bagaimana pengalaman pengguna secara keseluruhan?"
            value={data.user_experience}
            onChange={(value) => updateData('user_experience', value)}
            labels={['Sangat Buruk', 'Buruk', 'Cukup', 'Baik', 'Sangat Baik']}
          />

          <MultipleChoiceQuestion
            label="5. Apakah fitur sistem sudah lengkap untuk kebutuhan admin?"
            value={data.feature_completeness}
            onChange={(value) => updateData('feature_completeness', value)}
            options={[
              { value: 'very_complete', label: 'Sangat lengkap' },
              { value: 'complete', label: 'Lengkap' },
              { value: 'adequate', label: 'Cukup lengkap' },
              { value: 'incomplete', label: 'Kurang lengkap' },
              { value: 'very_incomplete', label: 'Tidak lengkap' }
            ]}
          />

          <ScaleQuestion
            label="6. Apakah Anda akan merekomendasikan sistem ini?"
            value={data.recommendation_score}
            onChange={(value) => updateData('recommendation_score', value)}
            labels={['Definitely No', 'Probably No', 'Maybe', 'Probably Yes', 'Definitely Yes']}
          />

          <TextQuestion
            label="7. Most Liked Features (Opsional)"
            value={data.most_liked_features}
            onChange={(value) => updateData('most_liked_features', value)}
            placeholder="Fitur apa yang paling Anda sukai?"
            isTextarea={true}
            isRequired={false}
          />

          <TextQuestion
            label="8. Most Disliked Features (Opsional)"
            value={data.most_disliked_features}
            onChange={(value) => updateData('most_disliked_features', value)}
            placeholder="Fitur apa yang paling Anda tidak sukai?"
            isTextarea={true}
            isRequired={false}
          />

          <TextQuestion
            label="9. Missing Features (Opsional)"
            value={data.missing_features}
            onChange={(value) => updateData('missing_features', value)}
            placeholder="Fitur apa yang masih kurang dan perlu ditambahkan?"
            isTextarea={true}
            isRequired={false}
          />

          <TextQuestion
            label="10. Overall Suggestions (Opsional)"
            value={data.overall_suggestions}
            onChange={(value) => updateData('overall_suggestions', value)}
            placeholder="Saran keseluruhan untuk perbaikan sistem?"
            isTextarea={true}
            isRequired={false}
          />

          <TextQuestion
            label="11. Bug Reports (Opsional)"
            value={data.bug_reports}
            onChange={(value) => updateData('bug_reports', value)}
            placeholder="Apakah ada bug/error yang ditemukan? Jelaskan detailnya..."
            isTextarea={true}
            isRequired={false}
          />
        </VStack>
      </FormSection>
    </VStack>
  );
};

export default OverallEvaluationSection;
