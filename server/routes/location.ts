import type { Express, Request, Response } from "express";
import serverAxiosClient from "../axiosClient";

export function registerLocationRoutes(app: Express) {
  app.get("/api/location/ip", async (req: Request, res: Response) => {
    try {
      let clientIP = req.headers['x-forwarded-for'] || 
                      req.headers['x-real-ip'] || 
                      req.connection.remoteAddress || 
                      req.socket.remoteAddress ||
                      (req.connection as any)?.socket?.remoteAddress ||
                      '127.0.0.1';
      
      if (typeof clientIP === 'string' && clientIP.includes(',')) {
        clientIP = clientIP.split(',')[0].trim();
      }
      
      if (typeof clientIP === 'string' && clientIP.startsWith('::ffff:')) {
        clientIP = clientIP.replace('::ffff:', '');
      }
      
      console.log('IP-based location detection for IP:', clientIP);
      
      const ipResponse = await serverAxiosClient.get(`http://ip-api.com/json/${clientIP}?fields=status,message,country,regionName,city,lat,lon,timezone`);
      
      if (ipResponse.data.status === 'success') {
        const locationData = {
          coordinates: {
            lat: ipResponse.data.lat,
            lng: ipResponse.data.lon
          },
          location: `${ipResponse.data.city}, ${ipResponse.data.regionName}, ${ipResponse.data.country}`,
          timezone: ipResponse.data.timezone,
          source: 'ip'
        };
        
        console.log('IP-based location detected:', locationData);
        return res.json(locationData);
      } else {
        console.log('IP-based location failed:', ipResponse.data.message);
        return res.status(400).json({ error: 'Could not determine location from IP address' });
      }
    } catch (error) {
      console.error('IP-based location detection error:', error);
      return res.status(500).json({ error: 'Failed to detect location from IP' });
    }
  });

  app.get("/api/location/:lat/:lon", async (req: Request, res: Response) => {
    try {
      const { lat, lon } = req.params;
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lon);

      if (isNaN(latitude) || isNaN(longitude)) {
        return res.status(400).json({ message: "Invalid coordinates" });
      }

      const response = await serverAxiosClient.get(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`
      );

      if (response.data) {
        return res.json({
          country: response.data.address?.country || 'Unknown',
          city: response.data.address?.city || response.data.address?.town || response.data.address?.village || 'Unknown',
          state: response.data.address?.state || response.data.address?.province || null,
          coordinates: { latitude, longitude }
        });
      } else {
        return res.status(404).json({ message: "Location not found" });
      }
    } catch (error) {
      console.error('Error fetching location:', error);
      return res.status(500).json({ message: "Failed to fetch location data" });
    }
  });

  app.get("/api/hebrew-date/:date", async (req: Request, res: Response) => {
    try {
      const { date } = req.params;
      const inputDate = new Date(date);
      
      if (isNaN(inputDate.getTime())) {
        return res.status(400).json({ message: "Invalid date format" });
      }

      const year = inputDate.getFullYear();
      const month = inputDate.getMonth() + 1;
      const day = inputDate.getDate();

      const hebrewResponse = await serverAxiosClient.get(
        `https://www.hebcal.com/converter?cfg=json&gy=${year}&gm=${month}&gd=${day}&g2h=1`
      );

      const eventsResponse = await serverAxiosClient.get(
        `https://www.hebcal.com/hebcal?v=1&cfg=json&year=${year}&month=${month}&maj=on&min=on&nx=on`
      );

      let isRoshChodesh = false;
      let events: string[] = [];

      if (eventsResponse.data && eventsResponse.data.items) {
        const dateString = inputDate.toISOString().split('T')[0];
        const dayEvents = eventsResponse.data.items.filter((item: any) => {
          if (item.date) {
            const eventDate = new Date(item.date).toISOString().split('T')[0];
            return eventDate === dateString;
          }
          return false;
        });

        events = dayEvents.map((item: any) => item.title || item.hebrew || '');
        isRoshChodesh = events.some(event => 
          event.toLowerCase().includes('rosh chodesh') ||
          event.toLowerCase().includes('ראש חודש')
        );
      }

      if (hebrewResponse.data) {
        let monthLength = 30;
        
        const hebrewMonth = hebrewResponse.data.hm || '';
        const shortMonths = ['Tevet', 'Adar I', 'Adar', 'Iyyar', 'Tammuz', 'Elul'];
        if (shortMonths.includes(hebrewMonth)) {
          monthLength = 29;
        }
        
        if (hebrewResponse.data.monthLength) {
          monthLength = hebrewResponse.data.monthLength;
        }
        
        return res.json({
          hebrew: hebrewResponse.data.hebrew || '',
          date: date,
          isRoshChodesh,
          events,
          hebrewDay: hebrewResponse.data.hd,
          hebrewMonth: hebrewResponse.data.hm,
          hebrewYear: hebrewResponse.data.hy,
          monthLength: monthLength,
          dd: hebrewResponse.data.hd,
          hm: hebrewResponse.data.hm
        });
      } else {
        return res.status(404).json({ message: "Hebrew date not found" });
      }
    } catch (error) {
      console.error('Error fetching Hebrew date:', error);
      return res.status(500).json({ message: "Failed to fetch Hebrew date" });
    }
  });
}
