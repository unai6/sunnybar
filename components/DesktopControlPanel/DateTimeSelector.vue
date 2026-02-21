<script setup lang="ts">
import Button from 'primevue/button'

type Props = {
  selectedDateTime: Date
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update-datetime': [datetime: Date]
}>()

const localDateTime = ref(props.selectedDateTime)

watch(() => props.selectedDateTime, (newVal) => {
  localDateTime.value = newVal
})

function handleDateTimeChange(value: Date | Date[] | (Date | null)[] | null | undefined): void {
  if (value instanceof Date) {
    emit('update-datetime', value)
  }
}

function adjustTime(hours: number): void {
  const newDate = new Date(localDateTime.value)
  newDate.setHours(newDate.getHours() + hours)
  localDateTime.value = newDate
  emit('update-datetime', newDate)
}

function setToNow(): void {
  const now = new Date()
  localDateTime.value = now
  emit('update-datetime', now)
}
</script>

<template>
  <div class="mb-6 md:mb-4">
    <h3 class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3 md:mb-2 uppercase tracking-wider">
      <i class="pi pi-clock text-gray-500" />
      {{ $t('controlPanel.title.dateTime') }}
    </h3>
    <div class="flex flex-col gap-2">
      <BaseDatePicker
        v-model="localDateTime"
        @update:model-value="handleDateTimeChange"
      />
      <div class="flex justify-center gap-2">
        <Button
          v-tooltip="$t('controlPanel.label.minusOneHour')"
          icon="pi pi-minus"
          severity="secondary"
          text
          rounded
          @click="adjustTime(-1)"
        />
        <Button
          :label="$t('controlPanel.button.now')"
          severity="secondary"
          text
          size="small"
          @click="setToNow"
        />
        <Button
          v-tooltip="$t('controlPanel.label.plusOneHour')"
          icon="pi pi-plus"
          severity="secondary"
          text
          rounded
          @click="adjustTime(1)"
        />
      </div>
    </div>
  </div>
</template>
