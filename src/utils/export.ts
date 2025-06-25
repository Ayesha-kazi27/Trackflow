import jsPDF from 'jspdf';
import type { Task } from '../types';

export const exportToPDF = (tasks: Task[], dateRange: string, userName: string) => {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(20);
  doc.text('Track Flow - Productivity Report', 20, 30);
  
  // User and date info
  doc.setFontSize(12);
  doc.text(`User: ${userName}`, 20, 45);
  doc.text(`Period: ${dateRange}`, 20, 55);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 65);
  
  // Summary stats
  const totalTasks = tasks.length;
  const totalTime = tasks.reduce((sum, task) => sum + task.duration_minutes, 0);
  const avgProductivity = totalTasks > 0 ? 
    tasks.reduce((sum, task) => sum + task.productivity_rating, 0) / totalTasks : 0;
  
  doc.setFontSize(14);
  doc.text('Summary', 20, 85);
  doc.setFontSize(10);
  doc.text(`Total Tasks: ${totalTasks}`, 25, 95);
  doc.text(`Total Time: ${Math.floor(totalTime / 60)}h ${totalTime % 60}m`, 25, 105);
  doc.text(`Average Productivity: ${avgProductivity.toFixed(1)}/5`, 25, 115);
  
  // Tasks table
  let yPos = 135;
  doc.setFontSize(14);
  doc.text('Tasks', 20, yPos);
  yPos += 10;
  
  doc.setFontSize(8);
  doc.text('Task Name', 20, yPos);
  doc.text('Category', 80, yPos);
  doc.text('Duration', 120, yPos);
  doc.text('Rating', 160, yPos);
  yPos += 5;
  
  // Draw line
  doc.line(20, yPos, 190, yPos);
  yPos += 10;
  
  tasks.forEach((task) => {
    if (yPos > 270) { // New page if needed
      doc.addPage();
      yPos = 30;
    }
    
    doc.text(task.task_name.substring(0, 30), 20, yPos);
    doc.text(task.category, 80, yPos);
    doc.text(`${Math.floor(task.duration_minutes / 60)}h ${task.duration_minutes % 60}m`, 120, yPos);
    doc.text(`${task.productivity_rating}/5`, 160, yPos);
    yPos += 10;
  });
  
  doc.save(`track-flow-report-${dateRange.replace(/\s+/g, '-').toLowerCase()}.pdf`);
};

export const exportToCSV = (tasks: Task[], dateRange: string) => {
  const headers = [
    'Task Name',
    'Category',
    'Date',
    'Start Time',
    'End Time',
    'Duration (minutes)',
    'Productivity Rating',
  ];
  
  const csvContent = [
    headers.join(','),
    ...tasks.map(task => [
      `"${task.task_name}"`,
      task.category,
      task.date,
      task.start_time,
      task.end_time,
      task.duration_minutes,
      task.productivity_rating,
    ].join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `track-flow-data-${dateRange.replace(/\s+/g, '-').toLowerCase()}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};