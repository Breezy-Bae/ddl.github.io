
import * as XLSX from 'xlsx';
import { Team, Actress } from '@/types';
import { formatIndianCurrency } from './currencyUtils';

interface TeamWithActresses extends Team {
  actresses: Actress[];
}

export const exportTeamLineups = (teams: Team[], actresses: Actress[]) => {
  try {
    // Group actresses by team
    const teamsWithActresses: TeamWithActresses[] = teams.map(team => {
      const teamActresses = actresses.filter(actress => actress.teamId === team.id);
      return {
        ...team,
        actresses: teamActresses
      };
    });

    // Create workbook
    const wb = XLSX.utils.book_new();
    
    // Team Summary Sheet
    const teamSummaryData = teamsWithActresses.map(team => ({
      'Team Name': team.name,
      'Owner': team.ownerName || 'Unassigned',
      'Total Budget': formatIndianCurrency(team.budget || 0),
      'Remaining Budget': formatIndianCurrency(team.remainingPurse || 0),
      'Actresses': `${team.currentActresses || 0}/${team.maxActresses || 0}`,
      'Status': team.isActive ? 'Active' : 'Inactive'
    }));
    
    const teamSummarySheet = XLSX.utils.json_to_sheet(teamSummaryData);
    XLSX.utils.book_append_sheet(wb, teamSummarySheet, 'Team Summary');

    // Detailed Team Lineups Sheet
    const detailedData: any[] = [];
    
    teamsWithActresses.forEach(team => {
      // Add team header row
      detailedData.push({
        'Team': team.name,
        'Owner': team.ownerName || 'Unassigned',
        'Budget': formatIndianCurrency(team.budget || 0),
        'Remaining': formatIndianCurrency(team.remainingPurse || 0),
      });
      
      // Add empty row
      detailedData.push({});
      
      // Add actress header
      detailedData.push({
        'Actress Name': 'Actress Name',
        'Category': 'Category',
        'Base Price': 'Base Price',
        'Purchase Price': 'Purchase Price',
      });
      
      // Add actress data
      team.actresses.forEach(actress => {
        detailedData.push({
          'Actress Name': actress.name,
          'Category': actress.category,
          'Base Price': formatIndianCurrency(actress.basePrice || 0),
          'Purchase Price': formatIndianCurrency(actress.purchasePrice || 0),
        });
      });
      
      // Add empty rows between teams
      detailedData.push({});
      detailedData.push({});
    });
    
    const detailedSheet = XLSX.utils.json_to_sheet(detailedData);
    XLSX.utils.book_append_sheet(wb, detailedSheet, 'Team Lineups');

    // Bids History Sheet
    const bidHistorySheet = XLSX.utils.aoa_to_sheet([
      ['Team', 'Actress', 'Category', 'Base Price', 'Final Price', 'Purchased On']
    ]);
    XLSX.utils.book_append_sheet(wb, bidHistorySheet, 'Purchase History');
    
    // Generate Excel file
    XLSX.writeFile(wb, 'Diva_Draft_League_Teams.xlsx');
    
    return true;
  } catch (error) {
    console.error('Error exporting data:', error);
    return false;
  }
};

export const exportBidHistory = async (bidHistory: any[]) => {
  try {
    const wb = XLSX.utils.book_new();
    
    const bidData = bidHistory.map(bid => ({
      'Bidder Name': bid.bidderName || 'Unknown',
      'Team': bid.teamName || 'Unknown',
      'Amount': formatIndianCurrency(bid.amount || 0),
      'Timestamp': bid.timestamp?.toDate?.() ? new Date(bid.timestamp.toDate()).toLocaleString() : 'Unknown'
    }));
    
    const bidSheet = XLSX.utils.json_to_sheet(bidData);
    XLSX.utils.book_append_sheet(wb, bidSheet, 'Bid History');
    
    XLSX.writeFile(wb, 'Diva_Draft_League_Bids.xlsx');
    
    return true;
  } catch (error) {
    console.error('Error exporting bids:', error);
    return false;
  }
};
