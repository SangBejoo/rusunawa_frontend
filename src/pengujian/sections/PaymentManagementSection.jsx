import React from 'react';
import { VStack } from '@chakra-ui/react';
import FormSection, { 
  ScaleQuestion, 
  MultipleChoiceQuestion, 
  TextQuestion 
} from '../components/FormSection';

const PaymentManagementSection = ({ data, onChange }) => {
  const updateData = (field, value) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  return (
    <VStack spacing={6} align="stretch">
      <FormSection
        title="Payment Management Testing"
        description="Test fitur verifikasi pembayaran"
        isRequired={true}
        alertMessage="Pastikan Anda telah mencoba fitur-fitur Payment Management"
        alertType="warning"
      >
        <VStack spacing={6} align="stretch">
          <ScaleQuestion
            label="1. Bagaimana tampilan bukti pembayaran?"
            value={data.payment_proof_display}
            onChange={(value) => updateData('payment_proof_display', value)}
            labels={['Sangat Buruk', 'Buruk', 'Cukup', 'Baik', 'Sangat Baik']}
          />

          <ScaleQuestion
            label="2. Seberapa mudah proses verifikasi pembayaran?"
            value={data.verification_process}
            onChange={(value) => updateData('verification_process', value)}
            labels={['Sangat Sulit', 'Sulit', 'Cukup', 'Mudah', 'Sangat Mudah']}
          />

          <MultipleChoiceQuestion
            label="3. Apakah status pembayaran sinkron dengan booking?"
            value={data.payment_status_sync}
            onChange={(value) => updateData('payment_status_sync', value)}
            options={[
              { value: 'always_sync', label: 'Ya, selalu sinkron' },
              { value: 'sometimes_sync', label: 'Ya, kadang-kadang sinkron' },
              { value: 'not_sync', label: 'Tidak sinkron' },
              { value: 'unknown', label: 'Tidak tahu' }
            ]}
          />

          <ScaleQuestion
            label="4. Bagaimana fitur history pembayaran?"
            value={data.payment_history}
            onChange={(value) => updateData('payment_history', value)}
            labels={['Sangat Buruk', 'Buruk', 'Cukup', 'Baik', 'Sangat Baik']}
          />

          <TextQuestion
            label="5. Payment Management Feedback (Opsional)"
            value={data.payment_management_feedback}
            onChange={(value) => updateData('payment_management_feedback', value)}
            placeholder="Saran untuk Payment Management?"
            isTextarea={true}
            isRequired={false}
          />
        </VStack>
      </FormSection>
    </VStack>
  );
};

export default PaymentManagementSection;
