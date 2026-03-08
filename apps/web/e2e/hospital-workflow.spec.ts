import { test, expect } from '@playwright/test';

test.describe('Full Hospital Workflow - Happy Path', () => {

    // Give the E2E test more time since it involves waiting for multiple DB calls and UI transitions
    test.setTimeout(600000); // 10 minutes

    test('Patient Registration -> Appointment Booking -> Status Updates', async ({ browser }) => {

        // We only need one staff context for this path (Receptionist/Admin)
        const context = await browser.newContext();
        const page = await context.newPage();

        // Test Data generator to ensure unique records every run
        const testId = Date.now().toString().slice(-6); // e.g. "543210"
        const patientData = {
            firstName: `E2ETestGen`,
            lastName: `Patient_${testId}`,
            dob: '2015-05-15',
            guardianName: `Parent_${testId}`,
            phone: `989${testId}0`, // Needs to be 10 digits
        };

        // =========================================================================
        // STEP 0: Staff Login
        // =========================================================================
        await test.step('Log into the application', async () => {
            await page.goto('/login');
            // Wait for the login form to appear
            await expect(page.getByRole('heading', { level: 2, name: /Sign in to your account/i })).toBeVisible();

            // Since the backend API might still be booting up in the test environment, we retry the login an extra time if it fails
            await page.getByPlaceholder('you@carenest.com').fill('admin@carenest.com');
            await page.getByPlaceholder('••••••••').fill('Admin@1234');

            await expect(async () => {
                await page.getByRole('button', { name: 'Sign in' }).click();
                // If error banner appears, it throws and retries
                const errorBanner = page.getByText('Unable to connect to server. Please try again.');
                if (await errorBanner.isVisible()) {
                    throw new Error('Backend not ready');
                }
                // Wait for dashboard to load to confirm login was successful
                await expect(page.getByRole('heading', { level: 2, name: /Sign in to your account/i })).toBeHidden({ timeout: 5000 });
            }).toPass({
                intervals: [5000, 10000, 15000],
                timeout: 120000
            });

        });

        // =========================================================================
        // STEP 1: Patient Registration
        // =========================================================================
        await test.step('Register a new patient', async () => {
            await page.goto('/patients/register');

            // Wait for page to fully load
            await expect(page.getByRole('heading', { level: 1, name: /New Patient Registration/i })).toBeVisible();

            // Fill out the required form fields
            await page.getByPlaceholder('First name').fill(patientData.firstName);
            await page.getByPlaceholder('Last name').fill(patientData.lastName);

            // Date of Birth needs a specific interaction or direct fill depending on the browser
            await page.locator('input[type="date"]').fill(patientData.dob);

            // Select Gender (uses Radix UI Select which requires clicking the trigger then the item)
            await page.locator('button[role="combobox"]').filter({ hasText: 'Select gender' }).click();
            await page.getByRole('option', { name: 'Male', exact: true }).click();

            // Guardian Info
            await page.getByPlaceholder('Guardian name').fill(patientData.guardianName);

            // Guardian Relation
            await page.locator('button[role="combobox"]').filter({ hasText: 'Select relation' }).click();
            await page.getByRole('option', { name: 'Father', exact: true }).click();

            // Phone
            await page.getByPlaceholder('10-digit mobile').fill(patientData.phone);

            // Submit Registration
            await page.getByRole('button', { name: /Register Patient/i }).click();

            // Assert Success Screen
            await expect(page.getByRole('heading', { level: 2, name: /Patient Registered Successfully/i })).toBeVisible({ timeout: 10000 });
        });

        // =========================================================================
        // STEP 2: Extract UHID
        // =========================================================================
        let extractedUHID = '';
        await test.step('Extract generated UHID', async () => {
            // The UHID is displayed inside a badge on the success screen
            // Look for the specific badge formatting
            const uhidBadge = page.locator('.bg-primary\\/10.text-primary.font-mono');
            await expect(uhidBadge).toBeVisible();
            extractedUHID = await uhidBadge.innerText();
            expect(extractedUHID).toBeTruthy();
            console.log(`Successfully registered patient with UHID: ${extractedUHID}`);
        });

        // =========================================================================
        // STEP 3: Book Appointment
        // =========================================================================
        await test.step('Book an appointment for the new patient', async () => {
            await page.goto('/appointments');

            // Open "New Appointment" Sheet
            await page.getByRole('button', { name: /New Appointment/i }).click();
            await expect(page.getByRole('heading', { name: /New Appointment/i }).locator('visible=true')).toBeVisible();

            // Search for our newly generated patient by UHID
            const searchInput = page.getByPlaceholder('Search by name or UHID…');
            await searchInput.fill(extractedUHID);

            // Wait for and click the search result dropdown
            // (The API call for search might take a second)
            const patientResult = page.locator('button').filter({ hasText: extractedUHID });
            await expect(patientResult).toBeVisible({ timeout: 10000 });
            await patientResult.click();

            // Verify the patient is locked in
            await expect(page.getByText(`${patientData.firstName} ${patientData.lastName}`)).toBeVisible();

            // Select Doctor
            const doctorSelect = page.locator('select.w-full.rounded-lg').first();
            await doctorSelect.selectOption({ index: 1 }); // Just pick the first available doctor

            // Select Department
            const deptSelect = page.locator('select.w-full.rounded-lg').nth(1);
            await deptSelect.selectOption({ index: 1 });

            // Select Appointment Type (Pills/Buttons)
            await page.getByRole('button', { name: 'Consultation', exact: true }).click();

            // Select first available Time Slot (excluding the disabled ones)
            const firstAvailableSlot = page.locator('button:has-text(":")').filter({ hasNot: page.locator('[disabled]') }).first();
            await firstAvailableSlot.click();

            // Submit Booking
            await page.getByRole('button', { name: 'Book Appointment' }).click();

            // The sheet should close automatically upon success
            await expect(page.getByRole('heading', { name: /New Appointment/i })).toBeHidden();
        });

        // =========================================================================
        // STEP 4: Status Updates Flow
        // =========================================================================
        await test.step('Update appointment status through its lifecycle', async () => {
            // Find our new appointment in the table by the Patient's Name or UHID
            const appointmentRow = page.locator('tr').filter({ hasText: patientData.firstName });

            // Ensure it's in the initial "Scheduled" state
            await expect(appointmentRow.getByText('Scheduled')).toBeVisible();

            // Click to open the status dropdown
            await appointmentRow.getByRole('button', { name: /Scheduled/i }).click();

            // Change to "In Progress"
            await page.getByRole('menuitem', { name: /Start/i }).click();

            // Wait for UI to reflect "In Progress"
            await expect(appointmentRow.getByRole('button', { name: /In Progress/i })).toBeVisible({ timeout: 8000 });

            // Click again to change to "Completed"
            await appointmentRow.getByRole('button', { name: /In Progress/i }).click();
            await page.getByRole('menuitem', { name: /Complete/i }).click();

            // Verify final status is a static badge (no longer a button) or the dropdown reads Completed
            // In your code: Completed is mapped to a static badge if there are no next actions, 
            // but let's just assert the text "Completed" is visible in that exact row
            await expect(appointmentRow.getByText('Completed')).toBeVisible({ timeout: 8000 });
        });

        await context.close();
    });
});
