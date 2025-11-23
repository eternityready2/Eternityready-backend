import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { PageContainer } from '@keystone-6/core/admin-ui/components';
import { Heading } from '@keystone-ui/core';
import 'react-datepicker/dist/react-datepicker.css';

function formatDateRangeTitle(from, until) {
  const options = { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' };
  return `${from.toLocaleDateString(undefined, options)} — ${until.toLocaleDateString(undefined, options)}`;
}

export default function AdStatsAreaChart() {
  const [fromDate, setFromDate] = useState(new Date(Date.now() - 24 * 60 * 60 * 1000));
  const [untilDate, setUntilDate] = useState(new Date());
  const [data, setData] = useState([]);

  const groupAndFormat = (events, start, end) => {
    const diffMs = end - start;
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    let groupBy, formatLabel;
    if (diffDays <= 1) {
      groupBy = d => {
        const date = new Date(d);
        date.setMinutes(0, 0, 0);
        return date.toISOString();
      };
      formatLabel = s => new Date(s).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays <= 60) {
      groupBy = d => {
        const date = new Date(d);
        date.setHours(0, 0, 0, 0);
        return date.toISOString();
      };
      formatLabel = s => new Date(s).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } else {
      groupBy = d => {
        const date = new Date(d);
        date.setDate(1);
        date.setHours(0, 0, 0, 0);
        return date.toISOString();
      };
      formatLabel = s => new Date(s).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
    }

    const bucketMap = {};
    events.forEach(e => {
      const key = groupBy(e.timestamp);
      if (!bucketMap[key]) bucketMap[key] = { x: key, clicks: 0, impressions: 0 };
      if (e.eventType === 'click') bucketMap[key].clicks += 1;
      if (e.eventType === 'impression') bucketMap[key].impressions += 1;
    });

    const bucketsArray = Object.values(bucketMap).sort((a, b) => new Date(a.x) - new Date(b.x));
    return bucketsArray.map(item => ({ ...item, x: formatLabel(item.x) }));
  };

  useEffect(() => {
    fetch('/api/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          query {
            ads {
              stats {
                eventType
                timestamp
              }
            }
          }
        `
      }),
    })
      .then(res => res.json())
      .then(res => {
        const events = [];
        res.data.ads.forEach(ad => {
          ad.stats.forEach(stat => {
            const t = new Date(stat.timestamp);
            if (t >= fromDate && t <= untilDate) {
              events.push({ eventType: stat.eventType, timestamp: t });
            }
          });
        });
        setData(groupAndFormat(events, fromDate, untilDate));
      });
  }, [fromDate, untilDate]);

  const dateInputStyle = {
    border: '1px solid gray',
    padding: '6px 10px',
    borderRadius: '4px',
    width: '140px',
    fontSize: '1rem',
    boxSizing: 'border-box',
  };

  return (
    <PageContainer>
      {/* Filters Section */}
      <section
        style={{
          padding: '1rem',
          marginBottom: '1.5rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          borderRadius: '8px',
          backgroundColor: 'white',
          maxWidth: '95vw',
          boxSizing: 'border-box',
        }}
        aria-label="View Statistics"
      >
        <h3 style={{ marginBottom: '1rem' }}>View Statistics</h3>
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap',
            justifyContent: 'flex-start',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 140px', minWidth: '140px' }}>
            <label htmlFor="from-date" style={{ marginBottom: '0.5rem' }}>From</label>
            <DatePicker
              id="from-date"
              selected={fromDate}
              onChange={(date) => date && setFromDate(date)}
              maxDate={untilDate}
              dateFormat="MMM d, yyyy"
              wrapperClassName="date-picker-wrapper"
              customInput={<input style={dateInputStyle} />}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 140px', minWidth: '140px' }}>
            <label htmlFor="until-date" style={{ marginBottom: '0.5rem' }}>Until</label>
            <DatePicker
              id="until-date"
              selected={untilDate}
              onChange={(date) => date && setUntilDate(date)}
              minDate={fromDate}
              maxDate={new Date()}
              dateFormat="MMM d, yyyy"
              wrapperClassName="date-picker-wrapper"
              customInput={<input style={dateInputStyle} />}
            />
          </div>
        </div>
      </section>

      {/* Chart Section */}
      <section
        style={{
          padding: '1rem',
          marginBottom: '1.5rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          borderRadius: '8px',
          backgroundColor: 'white',
          maxWidth: '95vw',
          boxSizing: 'border-box',
          overflowX: 'auto',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        aria-label="Ad Statistics Chart"
      >
        <h3 style={{ marginBottom: '1rem', fontWeight: 'normal' }}>
          {formatDateRangeTitle(fromDate, untilDate)}
        </h3>
        <AreaChart
          width={Math.min(900, window.innerWidth * 0.95)}
          height={350}
          data={data}
          margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="x" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Area
            type="monotone"
            dataKey="impressions"
            stroke="green"
            fill="green"
            dot={{ stroke: "green", strokeWidth: 2, fill: "#fff" }}
          />
          <Area
            type="monotone"
            dataKey="clicks"
            stroke="red"
            fill="red"
            dot={{ stroke: "red", strokeWidth: 2, fill: "#fff" }}
          />
        </AreaChart>
      </section>

      {/* Table Section */}
      <section
        style={{
          padding: '1rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          borderRadius: '8px',
          backgroundColor: 'white',
          maxWidth: '95vw',
          boxSizing: 'border-box',
          overflowX: 'auto',
        }}
        aria-label="Ad Statistics Table"
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '300px' }}>
          <thead>
            <tr>
              <th style={{ borderBottom: '2px solid #ddd', padding: '8px', textAlign: 'left' }}>Date</th>
              <th style={{ borderBottom: '2px solid #ddd', padding: '8px', textAlign: 'right' }}>Impressions</th>
              <th style={{ borderBottom: '2px solid #ddd', padding: '8px', textAlign: 'right' }}>Clicks</th>
            </tr>
          </thead>
          <tbody>
            {data.map(({ x, impressions, clicks }) => (
              <tr key={x}>
                <td style={{ borderBottom: '1px solid #eee', padding: '8px' }}>{x}</td>
                <td style={{ borderBottom: '1px solid #eee', padding: '8px', textAlign: 'right' }}>{impressions}</td>
                <td style={{ borderBottom: '1px solid #eee', padding: '8px', textAlign: 'right' }}>{clicks}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </PageContainer>
  );
}
