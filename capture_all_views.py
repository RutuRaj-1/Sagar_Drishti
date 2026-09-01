from playwright.sync_api import sync_playwright
import time
import os

os.makedirs('docs/screenshots', exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(
        executable_path='C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        headless=True,
        args=['--disable-web-security', '--allow-file-access-from-files']
    )
    
    page = browser.new_page(viewport={'width': 1440, 'height': 900})
    page.goto('http://localhost:5173')
    page.wait_for_selector('.topbar', timeout=15000)
    time.sleep(3) # wait for tiles and CMEMS canvas to paint
    
    # 1. 2D GIS Ocean Map View
    page.screenshot(path='docs/screenshots/01_2d_ocean_gis_map.png')
    print('1. Captured 01_2d_ocean_gis_map.png')
    
    # Click an Argo float in the right sidebar (.instrument-list li)
    try:
        float_item = page.locator('.instrument-list li').first
        if float_item.count() > 0:
            float_item.click()
            time.sleep(2)
            page.screenshot(path='docs/screenshots/04_model_vs_observed_colocation.png')
            print('4. Captured 04_model_vs_observed_colocation.png')
            
            # Click T-S diagram button
            ts_btn = page.locator('.profile-tab:has-text("T-S Diagram")')
            if ts_btn.count() > 0:
                ts_btn.click()
                time.sleep(2)
                page.screenshot(path='docs/screenshots/05_ts_watermass_diagram.png')
                print('5. Captured 05_ts_watermass_diagram.png')
    except Exception as e:
        print('Error clicking float item in sidebar:', e)

    # 2. 3D WebGL Terrain View
    try:
        # Switch back to depth tab or reset selection
        page.goto('http://localhost:5173')
        page.wait_for_selector('.topbar', timeout=15000)
        time.sleep(2)
        btn_3d = page.locator('.view-toggle-btn:has-text("3D")')
        if btn_3d.count() > 0:
            btn_3d.click()
            time.sleep(3)
            # Drag to rotate camera for an impressive angle
            canvas = page.locator('canvas').first
            box = canvas.bounding_box()
            if box:
                page.mouse.move(box['x'] + box['width']/2, box['y'] + box['height']/2)
                page.mouse.down()
                page.mouse.move(box['x'] + box['width']/2 + 180, box['y'] + box['height']/2 + 80, steps=20)
                page.mouse.up()
                time.sleep(2)
            page.screenshot(path='docs/screenshots/02_3d_webgl_terrain.png')
            print('2. Captured 02_3d_webgl_terrain.png')
    except Exception as e:
        print('Error in 3D capture:', e)

    # 3. Argo Explorer Tab
    try:
        argo_tab = page.locator('.topbar-tab:has-text("Argo Explorer")')
        argo_tab.click()
        time.sleep(3)
        page.screenshot(path='docs/screenshots/03_argo_in_situ_explorer.png')
        print('3. Captured 03_argo_in_situ_explorer.png')
    except Exception as e:
        print('Error in Argo Explorer capture:', e)

    # 6. Analytics Tab
    try:
        analytics_tab = page.locator('.topbar-tab:has-text("Analytics")')
        analytics_tab.click()
        time.sleep(3)
        page.screenshot(path='docs/screenshots/06_analytics_dashboard.png')
        print('6. Captured 06_analytics_dashboard.png')
    except Exception as e:
        print('Error in Analytics capture:', e)

    browser.close()
    print('All views captured successfully!')
