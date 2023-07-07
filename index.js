import puppeteer from "puppeteer-extra";
import stealthPlugin from "puppeteer-extra-plugin-stealth";
import axios from 'axios';
import Queue from 'queue';
import 'dotenv/config'
const queue = new Queue({ results: [] });

queue.push(async () => {
    const account = {
        email: "sassmpleemasil@gmail.com",
        password: "samplepassword",
        fullName: "Sample Name"
    }

    const token = await axios.post(process.env.REGISTER_URI, account).then(async (res) => {
        return await axios.post(process.env.LOGIN_URI, { email: account.email, password: account.password }).then(async (res) => {
            if (res.data.token) {
                return res.data.token;
            } else {
                console.log("QUEUE STOPPED -", res.data.message)
                process.exit();
            }
        });
    })

    if (!token) {
        console.log("QUEUE STOPPED -", "No token found");
        process.exit();
    }
    else
        (async () => {
            console.log("Puppeteer started - Token:", token);
            const browser = await puppeteer.launch({ headless: false });
            const page = await browser.newPage();
            await page.setUserAgent("5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.5807.0 Safari/537.36");
            await page.setViewport({ width: 1500, height: 1000 });

            /** LOGIN */

            await page.goto(process.env.LINKEDID_URI1, { waitUntil: 'networkidle2' });

            await page.waitForSelector('input[name=session_key]');
            await page.$eval('input[name=session_key]', val => val.value = process.env.LINKEDIN_EMAIL);

            await page.waitForSelector('input[name=session_password]');
            await page.$eval('input[name=session_password]', val => val.value = process.env.LINKEDIN_PASSWORD);

            await page.waitForSelector("button[data-litms-control-urn=login-submit]");
            await page.click("button[data-litms-control-urn=login-submit]")

            await page.waitForSelector('div.share-box-feed-entry__closed-share-box');
            await page.goto(process.env.LINKEDID_JOBS, { waitUntil: 'networkidle2' });

            /** GET JOB */
            await page.waitForSelector('.reusable-search__entity-result-list');
            const listItems = await page.$$('.reusable-search__result-container');

            const concurrencyLimit = 5;
            const chunks = []; // Divide the list into chunks based on the concurrency limit
            for (let i = 0; i < listItems.length; i += concurrencyLimit) {
                chunks.push(listItems.slice(i, i + concurrencyLimit));
            }

            const processChunk = async (chunk) => {
                const pagePromises = chunk.map(async (listItem) => {
                    const span = await listItem.$('.entity-result__title-text.t-16');
                    if (span) {
                        const link = await span.$('a.app-aware-link');
                        if (link) {
                            const linkURL = await page.evaluate((el) => el.href, link);
                            const jobTitle = await page.evaluate((el) => el.innerText.trim(), link);

                            const newPage = await browser.newPage();
                            await newPage.setViewport({ width: 1500, height: 1000 });
                            try {
                                await newPage.goto(linkURL);

                                /** CLICK EACH JOB AND GET APPLICANT */

                                const currentURL = newPage.url();
                                const pattern = /\/(\d+)\//;
                                const match = currentURL.match(pattern);

                                let jobId;

                                if (match) {
                                    const id = match[1];
                                    jobId = id;
                                } else {
                                    console.log('ID not found in URL');
                                }

                                await newPage.waitForSelector('.hiring-job-info-card__metric-item span.t-24', { timeout: 30000 });

                                const jobDescriptionElement = await newPage.$('.hiring-job-information__job-description');
                                const employmentTypeElement = await newPage.$('.hiring-job-information__job-details .t-14');

                                const jobDescription = await newPage.evaluate((el) => el.textContent.trim(), jobDescriptionElement);
                                const employmentType = await newPage.evaluate((el) => el.textContent.trim(), employmentTypeElement);

                                const job = { _id: jobId, jobTitle, jobDescription, employmentType };

                                const applicantsElement = await newPage.$('.hiring-job-info-card__metric-item span.t-24');
                                const applicantsText = await newPage.evaluate(element => element.textContent, applicantsElement);
                                const applicantsCount = parseInt(applicantsText);
                                const applicants = [];

                                if (applicantsCount === 0) {
                                    console.log('No applicants');
                                } else {
                                    /** GETTING APPLICANT */
                                    await newPage.waitForSelector('button ::-p-text(View applicants)', { timeout: 30000 });

                                    await newPage.locator('button ::-p-text(View applicants)').click();
                                    await newPage.waitForNavigation();

                                    await newPage.evaluate(() => {
                                        window.scrollTo(0, document.body.scrollHeight);
                                    });

                                    /** CLICKING EACH NAME TO GET THE DETAILS */
                                    const divElements = await newPage.$$('ul li div.artdeco-entity-lockup__content');

                                    for (const element of divElements) {
                                        await element.click();

                                        let candId;
                                        const currentURL = await newPage.url();
                                        const pattern = /applicants\/(\d+)/;
                                        const match = currentURL.match(pattern);

                                        if (match) {
                                            const id = match[1];
                                            candId = id;
                                        } else {
                                            console.log('id not found in URL');
                                        }

                                        await newPage.locator('button ::-p-text(More…)').click();

                                        const nameElement = await element.$('.artdeco-entity-lockup__title');
                                        const name = await newPage.evaluate((el) => el.textContent.trim(), nameElement);
                                        await
                                            newPage.waitForSelector('.artdeco-dropdown__content-inner > ul > li:nth-child(2) .hiring-applicant-header-actions__more-content-dropdown-item-text',
                                                { timeout: 30000 });
                                        await
                                            newPage.waitForSelector('.artdeco-dropdown__content-inner > ul > li:nth-child(3) .hiring-applicant-header-actions__more-content-dropdown-item-text',
                                                { timeout: 30000 });

                                        const emailElement =
                                            await newPage.$('.artdeco-dropdown__content-inner > ul > li:nth-child(2) .hiring-applicant-header-actions__more-content-dropdown-item-text');
                                        const phoneElement =
                                            await newPage.$('.artdeco-dropdown__content-inner > ul > li:nth-child(3) .hiring-applicant-header-actions__more-content-dropdown-item-text');

                                        const email = await newPage.evaluate(element => element.textContent.trim(), emailElement);
                                        const phone = await newPage.evaluate(element => element.textContent.trim(), phoneElement);

                                        applicants.push({ _id: candId + jobId, name, email, phone, jobId });

                                    }
                                }

                                await axios.post(process.env.JOB_API_URI, job, { headers: { "Authorization": `JWT ${token}` } })
                                    .then(response => {
                                        if (response.data.message) {
                                            console.error(response.data.message)
                                            process.exit();
                                        }
                                    })
                                    .catch(error => {
                                        console.error('Error inserting data:', error)
                                        process.exit();
                                    });

                                if (applicants.length !== 0) {
                                    applicants.forEach(async (applicant) => {
                                        await axios.post(process.env.APPLICANT_API_URI, applicant, { headers: { "Authorization": `JWT ${token}` } })
                                            .then(response => {
                                                if (response.data.message) {
                                                    console.error(response.data.message)
                                                    process.exit();
                                                }
                                            })
                                            .catch(error => {
                                                console.error('Error inserting data:', error)
                                                process.exit();
                                            });
                                    });
                                }
                            } catch (error) {
                                console.error('Error:', error)
                                process.exit();
                            } finally {
                                await newPage.close();
                            }
                        }
                    }
                });

                await Promise.all(pagePromises);
            };

            for (const chunk of chunks) {
                await processChunk(chunk);
            }

            await browser.close();
        })();
})

queue.start();