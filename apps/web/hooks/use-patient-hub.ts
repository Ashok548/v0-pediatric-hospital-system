import { useMemo } from "react"
import { usePatient } from "@/lib/api/patients"
import { usePatientAdmissions } from "@/lib/api/admissions"
import { usePatientVaccinations } from "@/lib/api/vaccinations"
import { usePrescriptions } from "@/lib/api/pharmacy"
import { usePatientGrowth } from "@/lib/api/nicu"
import { useOPVisits } from "@/lib/api/op-visits"
import { usePatientConsultations } from "@/lib/api/consultations"
import { usePatientLabOrders } from "@/lib/api/labs"
import { usePatientServiceOrders } from "@/lib/api/service-orders"
import {
    mapPatientHubData,
    type PatientHubApiInput,
    type PatientHubVaccination,
} from "@/lib/adapters/patient-hub"

type SectionError = Error | undefined

interface PatientHubSectionState {
    isLoading: boolean
    error?: SectionError
    retry: () => Promise<unknown>
}

interface PatientHubSectionsState {
    header: PatientHubSectionState
    clinicalSummary: PatientHubSectionState
    insights: PatientHubSectionState
    growth: PatientHubSectionState
    timeline: PatientHubSectionState
    cta: PatientHubSectionState
}

function firstError(...errors: unknown[]): SectionError {
    const match = errors.find(Boolean)
    return match instanceof Error ? match : match ? new Error("Failed to load section") : undefined
}

export function usePatientHub(patientId: string) {
    const { patient, isLoading, error, mutate } = usePatient(patientId)
    const {
        admissions,
        isLoading: admissionsLoading,
        error: admissionsError,
        mutate: mutateAdmissions,
    } = usePatientAdmissions(patient?.id ?? null)
    const {
        schedule,
        isLoading: vaccinationsLoading,
        error: vaccinationsError,
        mutate: mutateVaccinations,
    } = usePatientVaccinations(patient?.id ?? null)
    const {
        prescriptions,
        isLoading: prescriptionsLoading,
        error: prescriptionsError,
        mutate: mutatePrescriptions,
    } = usePrescriptions({ patientId: patient?.id ?? undefined })
    const {
        records: growthRecords,
        isLoading: growthLoading,
        error: growthError,
        mutate: mutateGrowth,
    } = usePatientGrowth(patient?.id ?? null)
    const {
        opVisits,
        isLoading: visitsLoading,
        error: visitsError,
        mutate: mutateVisits,
    } = useOPVisits({ patientId: patient?.id ?? undefined })
    const {
        consultations,
        isLoading: consultationsLoading,
        error: consultationsError,
        mutate: mutateConsultations,
    } = usePatientConsultations(patient?.id ?? null)
    const {
        orders: labOrders,
        isLoading: labOrdersLoading,
        error: labOrdersError,
        mutate: mutateLabOrders,
    } = usePatientLabOrders(patient?.id ?? null)
    const {
        orders: serviceOrders,
        isLoading: serviceOrdersLoading,
        error: serviceOrdersError,
        mutate: mutateServiceOrders,
    } = usePatientServiceOrders(patient?.id ?? null)

    const patientHub = useMemo(() => {
        const apiModel: PatientHubApiInput = {
            patientId,
            patient,
            admissions,
            opVisits,
            consultations,
            prescriptions,
            labOrders,
            serviceOrders,
            vaccinations: (schedule as PatientHubVaccination[]) ?? [],
            growthRecords,
        }

        return mapPatientHubData(apiModel)
    }, [admissions, consultations, growthRecords, labOrders, opVisits, patient, patientId, prescriptions, schedule, serviceOrders])

    const sections: PatientHubSectionsState = useMemo(() => ({
        header: {
            isLoading: admissionsLoading || visitsLoading,
            error: firstError(admissionsError, visitsError),
            retry: () => Promise.allSettled([mutateAdmissions(), mutateVisits()]),
        },
        clinicalSummary: {
            isLoading: growthLoading || vaccinationsLoading || prescriptionsLoading,
            error: firstError(growthError, vaccinationsError, prescriptionsError),
            retry: () => Promise.allSettled([mutateGrowth(), mutateVaccinations(), mutatePrescriptions()]),
        },
        insights: {
            isLoading: growthLoading || vaccinationsLoading || prescriptionsLoading || visitsLoading || admissionsLoading,
            error: firstError(growthError, vaccinationsError, prescriptionsError, visitsError, admissionsError),
            retry: () => Promise.allSettled([
                mutateGrowth(),
                mutateVaccinations(),
                mutatePrescriptions(),
                mutateVisits(),
                mutateAdmissions(),
            ]),
        },
        growth: {
            isLoading: growthLoading,
            error: firstError(growthError),
            retry: () => Promise.allSettled([mutateGrowth()]),
        },
        timeline: {
            isLoading: visitsLoading || consultationsLoading || prescriptionsLoading || admissionsLoading || vaccinationsLoading || labOrdersLoading || serviceOrdersLoading,
            error: firstError(visitsError, consultationsError, prescriptionsError, admissionsError, vaccinationsError, labOrdersError, serviceOrdersError),
            retry: () => Promise.allSettled([
                mutateVisits(),
                mutateConsultations(),
                mutatePrescriptions(),
                mutateAdmissions(),
                mutateVaccinations(),
                mutateLabOrders(),
                mutateServiceOrders(),
            ]),
        },
        cta: {
            isLoading: visitsLoading || consultationsLoading,
            error: firstError(visitsError, consultationsError),
            retry: () => Promise.allSettled([mutateVisits(), mutateConsultations()]),
        },
    }), [
        admissionsError,
        admissionsLoading,
        consultationsError,
        consultationsLoading,
        growthError,
        growthLoading,
        mutateAdmissions,
        mutateConsultations,
        mutateGrowth,
        mutateLabOrders,
        mutatePrescriptions,
        mutateServiceOrders,
        mutateVaccinations,
        mutateVisits,
        labOrdersError,
        labOrdersLoading,
        prescriptionsError,
        prescriptionsLoading,
        serviceOrdersError,
        serviceOrdersLoading,
        vaccinationsError,
        vaccinationsLoading,
        visitsError,
        visitsLoading,
    ])

    return {
        patientHub,
        isLoading,
        error,
        isMissing: !isLoading && !error && !patient,
        retry: mutate,
        sections,
    }
}